import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 予約投稿のキャンセル
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const post = await prisma.scheduledPost.findUnique({ where: { id } });
  if (!post || post.status !== 'PENDING') {
    return NextResponse.json({ error: 'キャンセルできません' }, { status: 400 });
  }

  await prisma.scheduledPost.update({
    where: { id },
    data: { status: 'CANCELLED' },
  });

  return NextResponse.json({ success: true });
}
