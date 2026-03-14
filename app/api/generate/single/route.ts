import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { buildBrandContext, fetchGoodExamples } from '@/lib/ai/buildPrompt';
import { generateSingle } from '@/lib/ai/multiGenerator';
import { MEDIA_LABELS, MEDIA_TYPES, type MediaType } from '@/types';
import { z } from 'zod';

const Schema = z.object({
  clinicId:         z.string().cuid(),
  theme:            z.string().min(1).max(200),
  symptom:          z.string().max(100).default(''),
  target:           z.string().max(100).default(''),
  areaName:         z.string().max(100).default(''),
  faqCount:         z.number().int().min(1).max(10).default(5),
  mediaType:        z.enum(MEDIA_TYPES as unknown as [string, ...string[]]),
  charCount:        z.enum(['short', 'medium', 'long']).default('medium'),
  writingStyle:     z.enum(['friendly', 'formal', 'casual']).default('friendly'),
  requiredKeywords: z.string().max(500).default(''),
  avoidExpressions: z.string().max(500).default(''),
});

export async function POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = Schema.safeParse(body);
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

  const startTime = Date.now();

  const brandContext = await buildBrandContext(input.clinicId);
  const goodExamples = await fetchGoodExamples(input.clinicId, [input.mediaType]);

  // 1媒体だけ生成（10秒以内に完了可能）
  const item = await generateSingle(
    {
      ...input,
      mediaTypes: [input.mediaType as MediaType],
    },
    brandContext,
    clinic.name,
    goodExamples,
    input.mediaType as MediaType,
  );

  const durationMs = Date.now() - startTime;

  // DB保存
  const label = MEDIA_LABELS[item.mediaType] ?? item.mediaType;
  const saved = await prisma.generatedContent.create({
    data: {
      clinicId:    input.clinicId,
      templateId:  null,
      type:        item.mediaType,
      title:       `[${label}] ${input.theme}`,
      inputParams: JSON.stringify({
        theme:     input.theme,
        symptom:   input.symptom,
        target:    input.target,
        areaName:  input.areaName,
        mediaType: input.mediaType,
      }),
      output: item.content,
      status: 'DRAFT',
      rating: 'none',
    },
  });

  // ログ保存
  await prisma.promptLog.create({
    data: {
      clinicId:     input.clinicId,
      contentId:    saved.id,
      model:        'claude-single',
      inputTokens:  0,
      outputTokens: item.charCount,
      durationMs,
    },
  });

  return NextResponse.json({
    ...item,
    contentId: saved.id,
    durationMs,
  }, { status: 201 });
}
