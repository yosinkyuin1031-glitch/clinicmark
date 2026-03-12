import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── GET: チラシ一覧 ───────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const clinicId = req.nextUrl.searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicIdが必要です' }, { status: 400 });

  const status    = req.nextUrl.searchParams.get('status')    ?? undefined;
  const flyerType = req.nextUrl.searchParams.get('flyerType') ?? undefined;

  const items = await prisma.flyer.findMany({
    where: {
      clinicId,
      ...(status    ? { status }    : {}),
      ...(flyerType ? { flyerType } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    data:  items.map((f) => ({ ...f, tags: JSON.parse(f.tags) })),
    total: items.length,
  });
}

// ─── POST: チラシ作成 ──────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json();
  const { clinicId, title, flyerType = 'A4', catchCopy = '', bodyText = '',
          backText = '', ctaText = '', targetText = '', designNotes = '',
          fileUrl = '', status = 'DRAFT', tags = [] } = body;

  if (!clinicId || !title) {
    return NextResponse.json({ error: 'clinicId・titleは必須です' }, { status: 400 });
  }

  const created = await prisma.flyer.create({
    data: {
      clinicId, title, flyerType, catchCopy, bodyText, backText,
      ctaText, targetText, designNotes, fileUrl, status,
      tags: JSON.stringify(tags),
    },
  });

  return NextResponse.json({ data: { ...created, tags: JSON.parse(created.tags) } });
}
