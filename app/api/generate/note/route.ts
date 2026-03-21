import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildBrandContext } from '@/lib/ai/buildPrompt';
import { generateNote } from '@/lib/ai/noteGenerator';
import type { NoteGenResult } from '@/types';
import { z } from 'zod';

const Schema = z.object({
  clinicId:     z.string().cuid(),
  theme:        z.string().min(1).max(200),
  noteType:     z.enum(['story', 'knowledge', 'column']).default('story'),
  target:       z.string().max(100).default(''),
  charTarget:   z.number().int().min(800).max(3000).default(1500),
  writingStyle: z.enum(['friendly', 'formal', 'casual']).default('friendly'),
  cta:          z.string().max(200).default(''),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

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

  // note下書き生成
  const generated = await generateNote(input, brandContext, clinic.name);

  const durationMs = Date.now() - startTime;

  // 生成物保存
  const NOTE_TYPE_LABELS: Record<string, string> = {
    story:     '体験談・症例',
    knowledge: 'お役立ち知識',
    column:    'コラム',
  };
  const content = await prisma.generatedContent.create({
    data: {
      clinicId:    input.clinicId,
      templateId:  null,
      type:        'NOTE_DRAFT',
      title:       `note下書き（${NOTE_TYPE_LABELS[input.noteType]}）: ${input.theme}`,
      inputParams: JSON.stringify({
        theme:        input.theme,
        noteType:     input.noteType,
        target:       input.target,
        charTarget:   input.charTarget,
        writingStyle: input.writingStyle,
        cta:          input.cta,
      }),
      output: JSON.stringify({
        titles:   generated.titles,
        body:     generated.body,
        hashtags: generated.hashtags,
        seoMemo:  generated.seoMemo,
      }),
      status: 'DRAFT',
    },
  });

  // ログ保存
  await prisma.promptLog.create({
    data: {
      clinicId:     input.clinicId,
      contentId:    content.id,
      model:        'mock-note',
      inputTokens:  0,
      outputTokens: generated.body.length,
      durationMs,
    },
  });

  const result: NoteGenResult = {
    contentId: content.id,
    ...generated,
    charCount: generated.body.length,
    durationMs,
  };

  return NextResponse.json(result, { status: 201 });
}
