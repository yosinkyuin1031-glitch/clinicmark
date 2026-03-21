import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── PATCH: ステップ更新 ───────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const { id } = await params;
  const body = await req.json();
  const { title, message, delayDays, delayHours, condition, stepNumber } = body;

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
}

// ─── DELETE: ステップ削除 ──────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const { id } = await params;
  await prisma.lineStep.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
