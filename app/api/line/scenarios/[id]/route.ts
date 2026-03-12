import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── GET: シナリオ詳細（ステップ含む） ─────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  const scenario = await prisma.lineScenario.findUnique({
    where: { id },
    include: { steps: { orderBy: { stepNumber: 'asc' } } },
  });

  if (!scenario) return NextResponse.json({ error: 'シナリオが見つかりません' }, { status: 404 });

  return NextResponse.json({ data: scenario });
}

// ─── PATCH: シナリオ更新 ───────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, scenarioType, description, triggerMemo, isActive } = body;

  const updated = await prisma.lineScenario.update({
    where: { id },
    data: {
      ...(title        !== undefined ? { title }        : {}),
      ...(scenarioType !== undefined ? { scenarioType } : {}),
      ...(description  !== undefined ? { description }  : {}),
      ...(triggerMemo  !== undefined ? { triggerMemo }  : {}),
      ...(isActive     !== undefined ? { isActive }     : {}),
    },
    include: { steps: { orderBy: { stepNumber: 'asc' } } },
  });

  return NextResponse.json({ data: updated });
}

// ─── DELETE: シナリオ削除（ステップも cascade） ─────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  await prisma.lineScenario.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
