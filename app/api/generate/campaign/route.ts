import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildBrandContext } from '@/lib/ai/buildPrompt';
import { generateCampaign } from '@/lib/ai/campaignGenerator';
import type { CampaignResult } from '@/types';
import { z } from 'zod';

const APPEAL_AXES  = ['pain', 'numbness', 'anxiety', 'nerve', 'last_resort'] as const;
const AD_TYPES_ARR = ['image_ad', 'video_ad', 'lp'] as const;

const Schema = z.object({
  clinicId:     z.string().cuid(),
  symptom:      z.string().min(1).max(100),
  target:       z.string().max(100).default(''),
  appealAxes:   z.array(z.enum(APPEAL_AXES)).min(1),
  adTypes:      z.array(z.enum(AD_TYPES_ARR)).min(1),
  writingStyle: z.enum(['friendly', 'formal', 'casual']).default('friendly'),
  ctaStrength:  z.union([z.literal(1), z.literal(2), z.literal(3)]).default(2),
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

  const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });
  }

  const startTime = Date.now();

  const brandContext = await buildBrandContext(input.clinicId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const outputs = await generateCampaign(input as any, brandContext, clinic.name);

  const durationMs = Date.now() - startTime;

  const content = await prisma.generatedContent.create({
    data: {
      clinicId:    input.clinicId,
      templateId:  null,
      type:        'META_AD',
      title:       `訴求軸別広告: ${input.symptom}（${outputs.length}軸）`,
      inputParams: JSON.stringify({
        symptom:    input.symptom,
        target:     input.target,
        appealAxes: input.appealAxes,
        adTypes:    input.adTypes,
      }),
      output: JSON.stringify(outputs),
      status: 'DRAFT',
    },
  });

  await prisma.promptLog.create({
    data: {
      clinicId:     input.clinicId,
      contentId:    content.id,
      model:        'mock-campaign',
      inputTokens:  0,
      outputTokens: outputs.reduce((sum, o) => sum + o.mainText.length + o.headline.length, 0),
      durationMs,
    },
  });

  const result: CampaignResult = {
    contentId: content.id,
    outputs,
    durationMs,
  };

  return NextResponse.json(result, { status: 201 });
}
