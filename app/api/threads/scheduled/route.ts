import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── POST: 予約投稿を作成 ────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  try {
    const body = await req.json();
    const { clinicId, content, imageUrl, scheduledAt, contentId } = body as {
      clinicId:   string;
      content:    string;
      imageUrl?:  string;
      scheduledAt:string;
      contentId?: string;
    };

    if (!clinicId || !content || !scheduledAt) {
      return NextResponse.json({ error: 'clinicId, content, scheduledAt は必須です' }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: 'scheduledAt の形式が不正です' }, { status: 400 });
    }
    if (scheduledDate <= new Date()) {
      return NextResponse.json({ error: '予約日時は現在時刻より後を指定してください' }, { status: 400 });
    }

    // Threads の 500 文字制限チェック
    if (content.length > 500) {
      return NextResponse.json({ error: '投稿文は 500 文字以内にしてください' }, { status: 400 });
    }

    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        clinicId,
        platform:   'threads',
        content,
        imageUrl:   imageUrl ?? '',
        scheduledAt: scheduledDate,
        contentId:  contentId ?? '',
      },
    });

    return NextResponse.json({ scheduledPost }, { status: 201 });
  } catch (err) {
    console.error('[threads/scheduled POST]', err);
    return NextResponse.json({ error: '予約投稿の作成に失敗しました' }, { status: 500 });
  }
}

// ─── GET: 予約投稿一覧を取得 ────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get('clinicId');
    const status   = searchParams.get('status');

    if (!clinicId) {
      return NextResponse.json({ error: 'clinicId は必須です' }, { status: 400 });
    }

    const scheduledPosts = await prisma.scheduledPost.findMany({
      where: {
        clinicId,
        ...(status ? { status } : {}),
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ scheduledPosts });
  } catch (err) {
    console.error('[threads/scheduled GET]', err);
    return NextResponse.json({ error: '予約投稿の取得に失敗しました' }, { status: 500 });
  }
}
