import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateText } from '@/lib/ai/client';
import { buildFullPrompt } from '@/lib/ai/buildPrompt';
import { z } from 'zod';

const PostSchema = z.object({
  type:     z.literal('post'),
  clinicId: z.string().cuid(),
  theme:    z.string().min(1).max(200),
  purpose:  z.string().optional().default('認知拡大'),
  target:   z.string().optional().default(''),
  title:    z.string().optional(),
});

const StorySchema = z.object({
  type:       z.literal('story'),
  clinicId:   z.string().cuid(),
  theme:      z.string().min(1).max(200),
  slideCount: z.string().optional().default('5'),
  title:      z.string().optional(),
});

const Schema = z.discriminatedUnion('type', [PostSchema, StorySchema]);

export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const isPost  = data.type === 'post';
  const TEMPLATE_ID = isPost ? 'tmpl-instagram-post' : 'tmpl-instagram-story';

  const inputs: Record<string, string> = isPost
    ? { theme: data.theme, purpose: data.purpose ?? '', target: data.target ?? '' }
    : { theme: data.theme, slideCount: (data as { type: 'story'; slideCount?: string }).slideCount ?? '5' };

  const contentType = isPost ? 'INSTAGRAM_POST' : 'INSTAGRAM_STORY';

  const prompt = await buildFullPrompt(TEMPLATE_ID, data.clinicId, inputs, contentType);
  const result = await generateText({
    prompt,
    maxTokens: 2000,
    _mockMeta: { templateId: TEMPLATE_ID, inputs },
  });
  const defaultTitle = isPost
    ? `Instagram投稿: ${data.theme}`
    : `ストーリーズ台本: ${data.theme}`;

  const content = await prisma.generatedContent.create({
    data: {
      clinicId:    data.clinicId,
      templateId:  TEMPLATE_ID,
      type:        contentType,
      title:       data.title ?? defaultTitle,
      inputParams: JSON.stringify(inputs),
      output:      result.text,
      status:      'DRAFT',
    },
  });

  await prisma.promptLog.create({
    data: {
      clinicId:     data.clinicId,
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
