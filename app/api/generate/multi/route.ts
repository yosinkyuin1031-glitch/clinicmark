import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildBrandContext, fetchGoodExamples } from '@/lib/ai/buildPrompt';
import { generateAll } from '@/lib/ai/multiGenerator';
import { MEDIA_TYPES, MEDIA_LABELS, type MultiGenResult, type OutputItem } from '@/types';
import { z } from 'zod';

const Schema = z.object({
  clinicId:         z.string().cuid(),
  theme:            z.string().min(1).max(200),
  symptom:          z.string().max(100).default(''),
  target:           z.string().max(100).default(''),
  areaName:         z.string().max(100).default(''),
  faqCount:         z.number().int().min(1).max(10).default(5),
  mediaTypes:       z.array(z.enum(MEDIA_TYPES as unknown as [string, ...string[]])).min(1),
  charCount:        z.enum(['short', 'medium', 'long']).default('medium'),
  writingStyle:     z.enum(['friendly', 'formal', 'casual']).default('friendly'),
  requiredKeywords: z.string().max(500).default(''),
  avoidExpressions: z.string().max(500).default(''),
});

export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) { // 認証一時無効
  //   return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効
  // } // 認証一時無効

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '入力値が不正です', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // 院情報取得
  const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });
  }

  const startTime = Date.now();

  // ブランドコンテキスト組み立て
  const brandContext = await buildBrandContext(input.clinicId);

  // 高評価コンテンツ例を取得（Few-shot 学習用）
  const goodExamples = await fetchGoodExamples(
    input.clinicId,
    input.mediaTypes,
  );

  // 全媒体を並列生成（良い例を注入）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawOutputs = await generateAll(input as any, brandContext, clinic.name, goodExamples);

  const durationMs = Date.now() - startTime;

  // 媒体ごとに個別 GeneratedContent レコードとして保存
  const savedIds = await Promise.all(
    rawOutputs.map(async (item) => {
      const label = MEDIA_LABELS[item.mediaType] ?? item.mediaType;
      const saved = await prisma.generatedContent.create({
        data: {
          clinicId:    input.clinicId,
          templateId:  null,
          type:        item.mediaType,   // "faq" | "blog_outline" など
          title:       `[${label}] ${input.theme}`,
          inputParams: JSON.stringify({
            theme:      input.theme,
            symptom:    input.symptom,
            target:     input.target,
            areaName:   input.areaName,
            faqCount:   input.faqCount,
            mediaTypes: input.mediaTypes,
          }),
          output: item.content,
          status: 'DRAFT',
          rating: 'none',
        },
      });
      return { mediaType: item.mediaType, contentId: saved.id };
    }),
  );

  // contentId を各 OutputItem に付与
  const idMap = new Map(savedIds.map(({ mediaType, contentId }) => [mediaType, contentId]));
  const outputs: OutputItem[] = rawOutputs.map((item) => ({
    ...item,
    contentId: idMap.get(item.mediaType),
  }));

  // 呼び出しログ保存（最初のレコードに紐付け）
  const firstId = savedIds[0]?.contentId;
  if (firstId) {
    await prisma.promptLog.create({
      data: {
        clinicId:     input.clinicId,
        contentId:    firstId,
        model:        'claude-multi',
        inputTokens:  0,
        outputTokens: outputs.reduce((sum, o) => sum + o.charCount, 0),
        durationMs,
      },
    });
  }

  const result: MultiGenResult = {
    contentId: firstId ?? '',
    outputs,
    durationMs,
  };

  return NextResponse.json(result, { status: 201 });
}
