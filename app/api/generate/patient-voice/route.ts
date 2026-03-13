import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { buildBrandContext } from '@/lib/ai/buildPrompt';
import { generateAllPatientVoice } from '@/lib/ai/patientVoiceGenerator';
import { PATIENT_VOICE_MEDIA_TYPES, PATIENT_VOICE_MEDIA_LABELS } from '@/types';

const schema = z.object({
  clinicId:     z.string().min(1),
  voiceText:    z.string().min(10, '患者の声は10文字以上入力してください'),
  symptom:      z.string().default(''),
  target:       z.string().default(''),
  mediaTypes:   z.array(z.enum(PATIENT_VOICE_MEDIA_TYPES)).min(1, '1つ以上の媒体を選択してください'),
  writingStyle: z.enum(['friendly', 'formal', 'casual']).default('friendly'),
});

export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { clinicId, voiceText, symptom, target, mediaTypes, writingStyle } = parsed.data;

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });

  const startTime   = Date.now();
  const brandContext = await buildBrandContext(clinicId);

  const rawOutputs = await generateAllPatientVoice(
    voiceText, symptom, target, writingStyle, mediaTypes, brandContext, clinic.name,
  );

  const durationMs = Date.now() - startTime;

  // まとめ保存
  const savedContent = await prisma.generatedContent.create({
    data: {
      clinicId,
      type:        'PATIENT_VOICE',
      title:       `患者の声から生成（${new Date().toLocaleDateString('ja-JP')}）`,
      inputParams: JSON.stringify({ voiceText: voiceText.slice(0, 100), symptom, target, mediaTypes }),
      output:      JSON.stringify(rawOutputs.map(o => ({ type: o.mediaType, content: o.content }))),
      status:      'DRAFT',
      rating:      'none',
      tags:        '[]',
      note:        '',
    },
  });

  // 個別アイテムも保存（ライブラリで参照できるように）
  for (const output of rawOutputs) {
    await prisma.generatedContent.create({
      data: {
        clinicId,
        type:        `PV_${output.mediaType.toUpperCase()}`,
        title:       `${PATIENT_VOICE_MEDIA_LABELS[output.mediaType]}（患者の声）`,
        inputParams: JSON.stringify({ voiceText: voiceText.slice(0, 100), symptom, target }),
        output:      output.content,
        status:      'DRAFT',
        rating:      'none',
        tags:        '[]',
        note:        '',
      },
    }).catch(() => {});   // ライブラリ保存はエラーでも握りつぶす
  }

  const outputs = rawOutputs.map(o => ({
    ...o,
    label:     PATIENT_VOICE_MEDIA_LABELS[o.mediaType],
    contentId: savedContent.id,
  }));

  return NextResponse.json({ data: { contentId: savedContent.id, outputs, durationMs } });
}
