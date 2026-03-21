import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// ─── GET /api/cron/threads-publish ───────────────────────
// Vercel Cron から呼ばれる。期限到来した予約投稿を Threads に送信する。
// CRON_SECRET ヘッダーで認証する。
export async function GET(req: NextRequest) {
  // ── 認証 ────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: '認証エラー' }, { status: 401 });
  }

  const now = new Date();

  // ── 対象レコードを取得 ──────────────────────────────────
  const pending = await prisma.scheduledPost.findMany({
    where: {
      status:      'PENDING',
      scheduledAt: { lte: now },
    },
    take: 20, // 1回の実行で最大20件処理
  });

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0, message: '処理対象なし' });
  }

  let processedCount = 0;
  let failedCount    = 0;

  for (const post of pending) {
    // ── 楽観的ロック: 他インスタンスが先に取得していればスキップ ──
    const locked = await prisma.scheduledPost.updateMany({
      where: { id: post.id, status: 'PENDING' },
      data:  { status: 'PROCESSING' },
    });
    if (locked.count === 0) continue; // 他インスタンスが先に処理

    try {
      // ── Threads 連携情報を取得 ─────────────────────────
      const connection = await prisma.socialConnection.findUnique({
        where: {
          clinicId_platform: {
            clinicId: post.clinicId,
            platform: 'threads',
          },
        },
      });

      if (!connection || !connection.isActive) {
        throw new Error('Threads が連携されていません');
      }
      if (connection.tokenExpiresAt < now) {
        throw new Error('Threads トークンが期限切れです');
      }

      const { accessToken, platformUserId } = connection;

      // ── Step 1: メディアコンテナ作成 ─────────────────
      const containerRes = await fetch(
        `https://graph.threads.net/v1.0/${platformUserId}/threads`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media_type:   'TEXT',
            text:         post.content,
            access_token: accessToken,
          }),
        },
      );
      const containerData = await containerRes.json();
      if (!containerRes.ok || !containerData.id) {
        throw new Error(
          `コンテナ作成失敗: ${containerData.error?.message ?? 'unknown'}`,
        );
      }

      // ── Step 2: 公開 ─────────────────────────────────
      const publishRes = await fetch(
        `https://graph.threads.net/v1.0/${platformUserId}/threads_publish`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id:  containerData.id,
            access_token: accessToken,
          }),
        },
      );
      const publishData = await publishRes.json();
      if (!publishRes.ok || !publishData.id) {
        throw new Error(
          `公開失敗: ${publishData.error?.message ?? 'unknown'}`,
        );
      }

      // ── 成功: PUBLISHED に更新 ────────────────────────
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data:  {
          status:      'PUBLISHED',
          publishedAt: now,
          errorMessage: '',
        },
      });

      // ── 元コンテンツにタグ付与（任意） ─────────────────
      if (post.contentId) {
        const current = await prisma.generatedContent.findUnique({
          where: { id: post.contentId }, select: { tags: true },
        });
        if (current) {
          const tags = JSON.parse(current.tags || '[]') as string[];
          if (!tags.includes('threads投稿済み')) {
            tags.push('threads投稿済み');
            await prisma.generatedContent.update({
              where: { id: post.contentId },
              data:  { tags: JSON.stringify(tags), status: 'APPROVED' },
            });
          }
        }
      }

      processedCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : '不明なエラー';
      console.error(`[cron] ScheduledPost ${post.id} 失敗:`, message);

      await prisma.scheduledPost.update({
        where: { id: post.id },
        data:  { status: 'FAILED', errorMessage: message },
      });

      failedCount++;
    }
  }

  return NextResponse.json({
    processed: processedCount,
    failed:    failedCount,
    total:     pending.length,
  });
}
