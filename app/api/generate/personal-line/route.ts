import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { buildBrandContext } from '@/lib/ai/buildPrompt';
import { generatePersonalLine } from '@/lib/ai/personalLineGenerator';

const schema = z.object({
  clinicId:    z.string().min(1),
  patientId:   z.string().min(1),
  sessionNote: z.string().min(1, '施術メモを入力してください'),
  lineType:    z.enum(['follow_up', 'reminder', 'reactivation']),
  tone:        z.enum(['friendly', 'formal', 'casual']).default('friendly'),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { clinicId, patientId, sessionNote, lineType, tone } = parsed.data;

  const [clinic, patient] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: clinicId } }),
    prisma.patient.findUnique({ where: { id: patientId } }),
  ]);
  if (!clinic)   return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });
  if (!patient)  return NextResponse.json({ error: '患者が見つかりません' }, { status: 404 });

  const brandContext = await buildBrandContext(clinicId);

  const message = await generatePersonalLine(
    patient.name,
    patient.symptom,
    sessionNote,
    patient.visitCount,
    lineType,
    tone,
    brandContext,
    clinic.name,
  );

  return NextResponse.json({ data: { message } });
}
