import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { buildBrandContext } from '@/lib/ai/buildPrompt';
import { generateVideoAds } from '@/lib/ai/videoAdGenerator';
import { VideoAdLength } from '@/types';

const schema = z.object({
  clinicId:    z.string().min(1),
  symptom:     z.string().min(1, '症状を入力してください'),
  target:      z.string().default(''),
  appealAxis:  z.string().default('痛み訴求'),
  adLengths:   z.array(z.enum(['15s', '30s', '60s'] as const)).min(1, '1つ以上の尺を選択してください'),
  tone:        z.enum(['friendly', 'formal', 'casual']).default('friendly'),
  ctaStrength: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
});

export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { clinicId, symptom, target, appealAxis, adLengths, tone, ctaStrength } = parsed.data;

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });

  const startTime    = Date.now();
  const brandContext = await buildBrandContext(clinicId);

  const scripts = await generateVideoAds(
    adLengths as VideoAdLength[],
    symptom, target, appealAxis, tone, ctaStrength, brandContext, clinic.name,
  );

  const durationMs = Date.now() - startTime;

  const savedContent = await prisma.generatedContent.create({
    data: {
      clinicId,
      type:        'VIDEO_AD',
      title:       `動画広告台本（${symptom}）`,
      inputParams: JSON.stringify({ symptom, target, appealAxis, adLengths, tone, ctaStrength }),
      output:      JSON.stringify(scripts),
      status:      'DRAFT',
      rating:      'none',
      tags:        '[]',
      note:        '',
    },
  });

  return NextResponse.json({ data: { contentId: savedContent.id, scripts, durationMs } });
}
