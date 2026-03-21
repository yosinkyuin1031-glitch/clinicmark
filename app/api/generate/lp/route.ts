import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateText } from '@/lib/ai/client';
import { buildFullPrompt } from '@/lib/ai/buildPrompt';
import { z } from 'zod';

const Schema = z.object({
  clinicId:    z.string().cuid(),
  sectionType: z.string().min(1),
  targetPage:  z.string().min(1).max(100),
  target:      z.string().optional().default(''),
  strength:    z.string().optional().default(''),
  title:       z.string().optional(),
});

const TEMPLATE_ID = 'tmpl-lp-section';

export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 });
  }

  const { clinicId, sectionType, targetPage, target, strength, title } = parsed.data;
  const inputs = { sectionType, targetPage, target, strength };

  let prompt: string;
  try {
    prompt = await buildFullPrompt(TEMPLATE_ID, clinicId, inputs, 'LP_SECTION');
  } catch {
    prompt = `院のブランドに合わせたLPセクション原稿を作成してください。\nセクション: ${sectionType}\n対象ページ: ${targetPage}\nターゲット: ${target}\n院の強み: ${strength}`;
  }

  const result = await generateText({
    prompt,
    maxTokens: 2500,
    _mockMeta: { templateId: TEMPLATE_ID, inputs },
  });

  const content = await prisma.generatedContent.create({
    data: {
      clinicId,
      type:        'LP_SECTION',
      title:       title ?? `LP[${sectionType}]: ${targetPage}`,
      inputParams: JSON.stringify(inputs),
      output:      result.text,
      status:      'DRAFT',
    },
  });

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
