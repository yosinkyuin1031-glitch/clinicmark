import { NextResponse }            from 'next/server';
import { getServerSession }        from 'next-auth';
import { authOptions }             from '@/lib/auth';
import { prisma }                  from '@/lib/db/prisma';
import { buildBrandContext }        from '@/lib/ai/buildPrompt';
import { generateImagePrompt }     from '@/lib/ai/imagePromptGenerator';
import { z }                       from 'zod';

const schema = z.object({
  clinicId:    z.string().min(1),
  useCase:     z.enum(['instagram', 'youtube', 'threads', 'ad']),
  theme:       z.string().default(''),
  symptom:     z.string().default(''),
  mood:        z.string().default(''),
  background:  z.string().default(''),
  hasHuman:    z.boolean().default(true),
  style:       z.enum(['illustration', 'photo']),
  aspectRatio: z.enum(['16:9', '1:1', '4:5', '9:16']),
});

export async function POST(req: Request) {
  try {
    // const session = await getServerSession(authOptions); // 認証一時無効
    // if (!session) { // 認証一時無効
      // return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効
    // } // 認証一時無効

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '入力値が不正です', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // 院情報
    const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });
    }

    // ブランドコンテキスト
    const brandContext = await buildBrandContext(input.clinicId);

    const start  = Date.now();
    const output = await generateImagePrompt(input, clinic.name);
    const durationMs = Date.now() - start;

    // 保存
    const saved = await prisma.generatedContent.create({
      data: {
        clinicId:    input.clinicId,
        templateId:  null,
        type:        'IMAGE_PROMPT',
        title:       `画像指示文: ${input.theme || input.symptom}（${input.useCase}）`,
        inputParams: JSON.stringify({
          useCase:     input.useCase,
          theme:       input.theme,
          symptom:     input.symptom,
          mood:        input.mood,
          background:  input.background,
          hasHuman:    String(input.hasHuman),
          style:       input.style,
          aspectRatio: input.aspectRatio,
        }),
        output: output.mainPrompt,
        status: 'DRAFT',
        tags:   JSON.stringify([input.useCase, 'image-prompt']),
        note:   '',
      },
    });

    // プロンプトログ
    await prisma.promptLog.create({
      data: {
        clinicId:     input.clinicId,
        contentId:    saved.id,
        inputTokens:  0,
        outputTokens: output.mainPrompt.length,
        durationMs,
        model:        'mock',
      },
    });

    return NextResponse.json(
      { contentId: saved.id, output, durationMs },
      { status: 201 },
    );
  } catch (e) {
    console.error('[image-prompt]', e);
    return NextResponse.json({ error: '生成中にエラーが発生しました' }, { status: 500 });
  }
}
