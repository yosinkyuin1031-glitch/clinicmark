import { NextResponse }         from 'next/server';
import { getServerSession }    from 'next-auth';
import { authOptions }         from '@/lib/auth';
import { prisma }              from '@/lib/db/prisma';
import { buildBrandContext }   from '@/lib/ai/buildPrompt';
import { analyzeCompetitor }   from '@/lib/ai/competitorAnalyzer';
import { z }                   from 'zod';

const COMPARE_TYPES = ['seo', 'meo', 'lp', 'instagram', 'appeal'] as const;

const schema = z.object({
  clinicId:       z.string().min(1),
  competitorName: z.string().min(1, '競合院名を入力してください'),
  url:            z.string().default(''),
  pageText:       z.string().min(10, '競合のテキストを貼り付けてください'),
  compareTypes:   z.array(z.enum(COMPARE_TYPES)).min(1, '分析軸を1つ以上選択してください'),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '入力値が不正です', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });
    }

    await buildBrandContext(input.clinicId);

    const start    = Date.now();
    const analysis = await analyzeCompetitor(input, clinic.name);
    const durationMs = Date.now() - start;

    // 競合分析をコンテンツとして保存
    const saved = await prisma.generatedContent.create({
      data: {
        clinicId:    input.clinicId,
        templateId:  null,
        type:        'COMPETITOR_MEMO',
        title:       `競合分析: ${input.competitorName}`,
        inputParams: JSON.stringify({
          competitorName: input.competitorName,
          url:            input.url,
          compareTypes:   input.compareTypes.join(','),
        }),
        output: JSON.stringify(analysis),
        status: 'DRAFT',
        tags:   JSON.stringify(['competitor', ...input.compareTypes]),
        note:   '',
      },
    });

    await prisma.promptLog.create({
      data: {
        clinicId:     input.clinicId,
        contentId:    saved.id,
        inputTokens:  input.pageText.length,
        outputTokens: JSON.stringify(analysis).length,
        durationMs,
        model:        'mock',
      },
    });

    return NextResponse.json(
      { contentId: saved.id, analysis, durationMs },
      { status: 201 },
    );
  } catch (e) {
    console.error('[competitor]', e);
    return NextResponse.json({ error: '分析中にエラーが発生しました' }, { status: 500 });
  }
}
