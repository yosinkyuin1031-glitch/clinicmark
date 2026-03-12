import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateText } from '@/lib/ai/client';
import { buildFullPrompt } from '@/lib/ai/buildPrompt';
import { z } from 'zod';

const Schema = z.object({
  clinicId:       z.string().cuid(),
  symptom:        z.string().min(1).max(100),
  targetPatient:  z.string().optional().default(''),
  additionalInfo: z.string().optional().default(''),
  title:          z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 });
  }

  const { clinicId, symptom, targetPatient, additionalInfo, title } = parsed.data;

  const TEMPLATE_ID = 'tmpl-faq-symptom';

  // プロンプト構築（👍👎 学習フィードバックを自動投入）
  const prompt = await buildFullPrompt(TEMPLATE_ID, clinicId, {
    symptom,
    targetPatient,
    additionalInfo,
  }, 'FAQ');

  // AI生成
  const result = await generateText({
    prompt,
    maxTokens: 2500,
    _mockMeta: { templateId: TEMPLATE_ID, inputs: { symptom, targetPatient, additionalInfo } },
  });

  // 保存
  const content = await prisma.generatedContent.create({
    data: {
      clinicId,
      templateId:  TEMPLATE_ID,
      type:        'FAQ',
      title:       title ?? `${symptom} のFAQページ`,
      inputParams: JSON.stringify({ symptom, targetPatient, additionalInfo }),
      output:      result.text,
      status:      'DRAFT',
    },
  });

  // ログ保存
  await prisma.promptLog.create({
    data: {
      clinicId,
      contentId:    content.id,
      model:        'claude-sonnet-4-5',
      inputTokens:  result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs:   result.durationMs,
    },
  });

  return NextResponse.json({
    content,
    inputTokens:  result.inputTokens,
    outputTokens: result.outputTokens,
    durationMs:   result.durationMs,
  }, { status: 201 });
}
