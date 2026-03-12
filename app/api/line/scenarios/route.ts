import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── GET: シナリオ一覧 ─────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const clinicId     = req.nextUrl.searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicIdが必要です' }, { status: 400 });

  const scenarioType = req.nextUrl.searchParams.get('scenarioType') ?? undefined;

  const items = await prisma.lineScenario.findMany({
    where: { clinicId, ...(scenarioType ? { scenarioType } : {}) },
    include: { steps: { orderBy: { stepNumber: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ data: items, total: items.length });
}

// ─── POST: シナリオ作成 ────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json();
  const {
    clinicId, title, scenarioType = 'custom',
    description = '', triggerMemo = '', isActive = true,
  } = body;

  if (!clinicId || !title) {
    return NextResponse.json({ error: 'clinicId・titleは必須です' }, { status: 400 });
  }

  const created = await prisma.lineScenario.create({
    data: { clinicId, title, scenarioType, description, triggerMemo, isActive },
    include: { steps: true },
  });

  return NextResponse.json({ data: created });
}
