import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const Schema = z.object({
  clinicId:  z.string().cuid(),
  text:      z.string().min(1).max(500),
  contentId: z.string().optional(), // 元コンテンツID（記録用）
});

// POST /api/threads/post
// Threads にテキスト投稿する
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });
  }

  const { clinicId, text, contentId } = parsed.data;

  // 連携情報を取得
  const connection = await prisma.socialConnection.findUnique({
    where: { clinicId_platform: { clinicId, platform: 'threads' } },
  });

  if (!connection) {
    return NextResponse.json(
      { error: 'Threads が連携されていません。設定画面から連携してください。' },
      { status: 400 },
    );
  }

  if (connection.expiresAt && connection.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Threads の認証トークンが期限切れです。再連携してください。' },
      { status: 400 },
    );
  }

  const { accessToken, userId: platformUserId } = connection;

  try {
    // ── Step 1: メディアコンテナ作成 ─────────────────────
    const containerRes = await fetch(
      `https://graph.threads.net/v1.0/${platformUserId}/threads`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          media_type:   'TEXT',
          text,
          access_token: accessToken,
        }),
      },
    );
    const containerData = await containerRes.json();
    if (!containerRes.ok || !containerData.id) {
      console.error('Threads container error:', containerData);
      return NextResponse.json(
        { error: `投稿コンテナの作成に失敗しました: ${containerData.error?.message ?? 'unknown'}` },
        { status: 500 },
      );
    }

    const creationId = containerData.id as string;

    // ── Step 2: 公開 ─────────────────────────────────────
    const publishRes = await fetch(
      `https://graph.threads.net/v1.0/${platformUserId}/threads_publish`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          creation_id:  creationId,
          access_token: accessToken,
        }),
      },
    );
    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      console.error('Threads publish error:', publishData);
      return NextResponse.json(
        { error: `投稿の公開に失敗しました: ${publishData.error?.message ?? 'unknown'}` },
        { status: 500 },
      );
    }

    const threadsPostId = publishData.id as string;

    // ── Step 3: 元コンテンツに投稿済みタグを付与（任意） ─
    if (contentId) {
      const current = await prisma.generatedContent.findUnique({
        where: { id: contentId }, select: { tags: true },
      });
      if (current) {
        const tags = JSON.parse(current.tags || '[]') as string[];
        if (!tags.includes('threads投稿済み')) {
          tags.push('threads投稿済み');
          await prisma.generatedContent.update({
            where: { id: contentId },
            data:  { tags: JSON.stringify(tags), status: 'APPROVED' },
          });
        }
      }
    }

    return NextResponse.json({
      success:      true,
      threadsPostId,
      username:     connection.username,
      postedAt:     new Date().toISOString(),
    });
  } catch (err) {
    console.error('Threads post error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '投稿中にエラーが発生しました' },
      { status: 500 },
    );
  }
}
