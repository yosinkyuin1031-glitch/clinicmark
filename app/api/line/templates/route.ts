import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

function safeJsonParse(str: string, fallback: unknown[] = []): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const clinicId = req.nextUrl.searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicIdが必要です' }, { status: 400 });

  const category = req.nextUrl.searchParams.get('category') ?? undefined;

  try {
    const items = await prisma.lineTemplate.findMany({
      where: { clinicId, ...(category ? { category } : {}) },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      data: items.map((t) => ({
        ...t,
        quickReplies: safeJsonParse(t.quickReplies, []),
        tags:         safeJsonParse(t.tags, []),
      })),
      total: items.length,
    });
  } catch (e) {
    console.error('[LINE templates GET]', e);
    return NextResponse.json({ error: 'テンプレート一覧の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  try {
    const body = await req.json();
    const { clinicId, title, category, message, quickReplies = [], isActive = true, tags = [] } = body;

    if (!clinicId || !title || !category || !message) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    // Input validation
    if (typeof title !== 'string' || title.length > 100) {
      return NextResponse.json({ error: 'タイトルは100文字以内で入力してください' }, { status: 400 });
    }
    if (typeof message !== 'string' || message.length > 1000) {
      return NextResponse.json({ error: 'メッセージは1000文字以内で入力してください' }, { status: 400 });
    }

    const created = await prisma.lineTemplate.create({
      data: {
        clinicId, title, category, message, isActive,
        quickReplies: JSON.stringify(quickReplies),
        tags:         JSON.stringify(tags),
      },
    });

    return NextResponse.json({
      data: {
        ...created,
        quickReplies: safeJsonParse(created.quickReplies, []),
        tags: safeJsonParse(created.tags, []),
      },
    });
  } catch (e) {
    console.error('[LINE templates POST]', e);
    return NextResponse.json({ error: 'テンプレートの作成に失敗しました' }, { status: 500 });
  }
}
