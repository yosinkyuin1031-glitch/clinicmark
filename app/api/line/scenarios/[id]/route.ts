import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── GET: シナリオ詳細（ステップ含む） ─────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  try {
    const scenario = await prisma.lineScenario.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });

    if (!scenario) return NextResponse.json({ error: 'シナリオが見つかりません' }, { status: 404 });

    return NextResponse.json({ data: scenario });
  } catch (e) {
    console.error('[LINE scenario GET]', e);
    return NextResponse.json({ error: 'シナリオの取得に失敗しました' }, { status: 500 });
  }
}

// ─── PATCH: シナリオ更新 ───────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, scenarioType, description, triggerMemo, isActive } = body;

    // Input validation
    if (title !== undefined && (typeof title !== 'string' || title.length === 0 || title.length > 100)) {
      return NextResponse.json({ error: 'タイトルは1〜100文字で入力してください' }, { status: 400 });
    }

    const updated = await prisma.lineScenario.update({
      where: { id },
      data: {
        ...(title        !== undefined ? { title }        : {}),
        ...(scenarioType !== undefined ? { scenarioType } : {}),
        ...(description  !== undefined ? { description }  : {}),
        ...(triggerMemo  !== undefined ? { triggerMemo }  : {}),
        ...(isActive     !== undefined ? { isActive }     : {}),
      },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error('[LINE scenario PATCH]', e);
    return NextResponse.json({ error: 'シナリオの更新に失敗しました' }, { status: 500 });
  }
}

// ─── DELETE: シナリオ削除（ステップも cascade） ─────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.lineScenario.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[LINE scenario DELETE]', e);
    return NextResponse.json({ error: 'シナリオの削除に失敗しました' }, { status: 500 });
  }
}
