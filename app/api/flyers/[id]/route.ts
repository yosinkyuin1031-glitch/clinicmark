import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── PATCH: チラシ更新 ─────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  const body  = await req.json();
  const { tags, ...rest } = body;

  const updated = await prisma.flyer.update({
    where: { id },
    data: {
      ...rest,
      ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
    },
  });

  return NextResponse.json({ data: { ...updated, tags: JSON.parse(updated.tags) } });
}

// ─── DELETE: チラシ削除 ────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;
  await prisma.flyer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
