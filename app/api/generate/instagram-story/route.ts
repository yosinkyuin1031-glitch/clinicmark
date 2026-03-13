import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildBrandContext } from '@/lib/ai/buildPrompt';
import { generateStory } from '@/lib/ai/instagramStoryGenerator';
import type { StoryGenResult } from '@/types';
import { z } from 'zod';

const Schema = z.object({
  clinicId:    z.string().cuid(),
  theme:       z.string().min(1).max(200),
  postType:    z.enum(['story', 'feed', 'reel']).default('story'),
  target:      z.string().max(100).default(''),
  mood:        z.enum(['warm', 'cool', 'pop', 'calm']).default('warm'),
  ctaStrength: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
  slideCount:  z.number().int().min(1).max(7).default(5),
  imageNotes:  z.string().max(300).default(''),
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

  // ブランドコンテキスト
  const brandContext = await buildBrandContext(input.clinicId);

  // ストーリー生成
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slides = await generateStory(input as any, brandContext, clinic.name);

  const durationMs = Date.now() - startTime;

  // 生成物保存
  const content = await prisma.generatedContent.create({
    data: {
      clinicId:    input.clinicId,
      templateId:  null,
      type:        'INSTAGRAM_STORY',
      title:       `Instagram${input.postType === 'story' ? 'ストーリーズ' : input.postType === 'reel' ? 'リール' : 'フィード'}: ${input.theme}（${slides.length}枚）`,
      inputParams: JSON.stringify({
        theme:      input.theme,
        postType:   input.postType,
        target:     input.target,
        mood:       input.mood,
        slideCount: input.slideCount,
      }),
      output: JSON.stringify(slides),
      status: 'DRAFT',
    },
  });

  // ログ保存
  await prisma.promptLog.create({
    data: {
      clinicId:     input.clinicId,
      contentId:    content.id,
      model:        'mock-story',
      inputTokens:  0,
      outputTokens: slides.reduce((sum, s) => sum + s.upperText.length + s.lowerText.length, 0),
      durationMs,
    },
  });

  const result: StoryGenResult = {
    contentId: content.id,
    slides,
  };

  return NextResponse.json(result, { status: 201 });
}
