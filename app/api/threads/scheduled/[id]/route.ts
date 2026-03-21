import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── DELETE: 予約投稿をキャンセル ───────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  try {
    const { id } = await params;

    // PENDING のものだけキャンセル可能
    const updated = await prisma.scheduledPost.updateMany({
      where: { id, status: 'PENDING' },
      data:  { status: 'CANCELLED' },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: '予約が見つからないか、すでに処理済みです' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[threads/scheduled DELETE]', err);
    return NextResponse.json({ error: 'キャンセルに失敗しました' }, { status: 500 });
  }
}
