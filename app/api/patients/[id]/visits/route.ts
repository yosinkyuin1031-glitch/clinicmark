import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const schema = z.object({
  sessionNote: z.string().min(1, '施術メモを入力してください'),
  nextAction:  z.string().default(''),
  visitedAt:   z.string().optional(),
});

// ─── POST: 来院記録を追加 ─────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id: patientId } = await params;
  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { sessionNote, nextAction, visitedAt } = parsed.data;

  const visit = await prisma.patientVisit.create({
    data: {
      patientId,
      sessionNote,
      nextAction,
      visitedAt: visitedAt ? new Date(visitedAt) : new Date(),
    },
  });

  // 来院回数と最終来院日を更新
  const visitCount = await prisma.patientVisit.count({ where: { patientId } });
  await prisma.patient.update({
    where: { id: patientId },
    data:  { visitCount, lastVisitAt: new Date(visitedAt ?? new Date()) },
  });

  return NextResponse.json({ data: visit });
}
