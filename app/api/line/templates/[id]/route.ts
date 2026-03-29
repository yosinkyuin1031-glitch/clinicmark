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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id }  = await params;

  try {
    const body    = await req.json();
    const { quickReplies, tags, ...rest } = body;

    // Input validation
    if (rest.title !== undefined && (typeof rest.title !== 'string' || rest.title.length === 0 || rest.title.length > 100)) {
      return NextResponse.json({ error: 'タイトルは1〜100文字で入力してください' }, { status: 400 });
    }
    if (rest.message !== undefined && (typeof rest.message !== 'string' || rest.message.length === 0 || rest.message.length > 1000)) {
      return NextResponse.json({ error: 'メッセージは1〜1000文字で入力してください' }, { status: 400 });
    }

    const updated = await prisma.lineTemplate.update({
      where: { id },
      data: {
        ...rest,
        ...(quickReplies !== undefined ? { quickReplies: JSON.stringify(quickReplies) } : {}),
        ...(tags         !== undefined ? { tags:         JSON.stringify(tags)         } : {}),
      },
    });

    return NextResponse.json({
      data: {
        ...updated,
        quickReplies: safeJsonParse(updated.quickReplies, []),
        tags: safeJsonParse(updated.tags, []),
      },
    });
  } catch (e) {
    console.error('[LINE template PATCH]', e);
    return NextResponse.json({ error: 'テンプレートの更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.lineTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[LINE template DELETE]', e);
    return NextResponse.json({ error: 'テンプレートの削除に失敗しました' }, { status: 500 });
  }
}
