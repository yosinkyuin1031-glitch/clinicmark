import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── PATCH: ステップ更新 ───────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, message, delayDays, delayHours, condition, stepNumber } = body;

    // Input validation
    if (message !== undefined && (typeof message !== 'string' || message.length === 0 || message.length > 1000)) {
      return NextResponse.json({ error: 'メッセージは1〜1000文字で入力してください' }, { status: 400 });
    }
    if (delayDays !== undefined && (typeof delayDays !== 'number' || delayDays < 0 || delayDays > 365)) {
      return NextResponse.json({ error: 'delayDaysは0〜365の範囲で入力してください' }, { status: 400 });
    }
    if (delayHours !== undefined && (typeof delayHours !== 'number' || delayHours < 0 || delayHours > 23)) {
      return NextResponse.json({ error: 'delayHoursは0〜23の範囲で入力してください' }, { status: 400 });
    }

    const updated = await prisma.lineStep.update({
      where: { id },
      data: {
        ...(title      !== undefined ? { title }      : {}),
        ...(message    !== undefined ? { message }    : {}),
        ...(delayDays  !== undefined ? { delayDays }  : {}),
        ...(delayHours !== undefined ? { delayHours } : {}),
        ...(condition  !== undefined ? { condition }  : {}),
        ...(stepNumber !== undefined ? { stepNumber } : {}),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error('[LINE step PATCH]', e);
    return NextResponse.json({ error: 'ステップの更新に失敗しました' }, { status: 500 });
  }
}

// ─── DELETE: ステップ削除 ──────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.lineStep.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[LINE step DELETE]', e);
    return NextResponse.json({ error: 'ステップの削除に失敗しました' }, { status: 500 });
  }
}
