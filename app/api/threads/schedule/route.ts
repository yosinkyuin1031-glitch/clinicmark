import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { clinicId, text, scheduledAt, contentId } = await request.json();

  if (!clinicId || !text || !scheduledAt) {
    return NextResponse.json({ error: 'clinicId, text, scheduledAt required' }, { status: 400 });
  }

  // Threads連携が有効か確認
  const connection = await prisma.socialConnection.findUnique({
    where: { clinicId_platform: { clinicId, platform: 'threads' } },
  });
  if (!connection) {
    return NextResponse.json({ error: 'Threadsアカウントが未連携です' }, { status: 400 });
  }

  const post = await prisma.scheduledPost.create({
    data: {
      clinicId,
      platform: 'threads',
      content: text,
      scheduledAt: new Date(scheduledAt),
      contentId: contentId || null,
    },
  });

  return NextResponse.json(post);
}

// 予約投稿一覧取得
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinicId');

  if (!clinicId) {
    return NextResponse.json({ error: 'clinicId required' }, { status: 400 });
  }

  const posts = await prisma.scheduledPost.findMany({
    where: { clinicId, platform: 'threads' },
    orderBy: { scheduledAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(posts);
}
