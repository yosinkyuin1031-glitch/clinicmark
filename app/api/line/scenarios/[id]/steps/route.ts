import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── POST: ステップ追加 ────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const { id: scenarioId } = await params;
  const body = await req.json();
  const {
    title, message, delayDays = 0, delayHours = 0, condition = '',
  } = body;

  if (!title || !message) {
    return NextResponse.json({ error: 'title・messageは必須です' }, { status: 400 });
  }

  // 現在の最大 stepNumber を取得
  const existing = await prisma.lineStep.findMany({
    where: { scenarioId },
    select: { stepNumber: true },
  });
  const maxStep = existing.reduce((max, s) => Math.max(max, s.stepNumber), 0);

  const created = await prisma.lineStep.create({
    data: {
      scenarioId,
      stepNumber: maxStep + 1,
      title, message, delayDays, delayHours, condition,
    },
  });

  return NextResponse.json({ data: created });
}
