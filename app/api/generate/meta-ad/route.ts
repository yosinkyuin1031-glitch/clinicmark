import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateText } from '@/lib/ai/client';
import { buildFullPrompt } from '@/lib/ai/buildPrompt';
import { z } from 'zod';

const Schema = z.object({
  clinicId: z.string().cuid(),
  theme:    z.string().min(1).max(100),
  adType:   z.string().optional().default('リード獲得'),
  target:   z.string().optional().default(''),
  service:  z.string().optional().default(''),
  title:    z.string().optional(),
});

const TEMPLATE_ID = 'tmpl-meta-ad';

export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 });
  }

  const { clinicId, theme, adType, target, service, title } = parsed.data;
  const inputs = { theme, adType, target, service };

  // プロンプト構築（テンプレートが存在しない場合は簡易プロンプトを使用）
  let prompt: string;
  try {
    prompt = await buildFullPrompt(TEMPLATE_ID, clinicId, inputs, 'META_AD');
  } catch {
    prompt = `院のブランドに合わせたMeta広告コピーを3案作成してください。\nテーマ: ${theme}\n広告タイプ: ${adType}\nターゲット: ${target}\n訴求サービス: ${service}`;
  }

  const result = await generateText({
    prompt,
    maxTokens: 2000,
    _mockMeta: { templateId: TEMPLATE_ID, inputs },
  });

  const content = await prisma.generatedContent.create({
    data: {
      clinicId,
      type:        'META_AD',
      title:       title ?? `Meta広告: ${theme}`,
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
