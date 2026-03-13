import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { publishToThreads } from '@/lib/threads';

const prisma = new PrismaClient();

// Vercel Cronで毎分実行される
// 予約時刻を過ぎたPENDINGの投稿を自動で公開する
export async function GET(request: Request) {
  // Cron認証（Vercel Cronからのリクエストか確認）
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // 予約時刻を過ぎたPENDINGの投稿を取得（最大10件ずつ処理）
  const pendingPosts = await prisma.scheduledPost.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
      platform: 'threads',
    },
    orderBy: { scheduledAt: 'asc' },
    take: 10,
  });

  if (pendingPosts.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let published = 0;
  let failed = 0;

  for (const post of pendingPosts) {
    // 処理中に変更（重複防止）
    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: 'PROCESSING' },
    });

    try {
      // Threads連携情報を取得
      const connection = await prisma.socialConnection.findUnique({
        where: { clinicId_platform: { clinicId: post.clinicId, platform: 'threads' } },
      });

      if (!connection) {
        throw new Error('Threads未連携');
      }

      // Threadsに投稿
      await publishToThreads(connection.userId, connection.accessToken, post.text);

      // 成功
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      });
      published++;
    } catch (e) {
      // 失敗
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: 'FAILED',
          errorLog: e instanceof Error ? e.message : 'Unknown error',
        },
      });
      failed++;
    }
  }

  return NextResponse.json({ processed: pendingPosts.length, published, failed });
}
