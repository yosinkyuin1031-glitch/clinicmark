import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── GET: 患者詳細（来院履歴含む） ───────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where:   { id },
    include: { visits: { orderBy: { visitedAt: 'desc' } } },
  });
  if (!patient) return NextResponse.json({ error: '患者が見つかりません' }, { status: 404 });

  return NextResponse.json({ data: patient });
}

// ─── PATCH: 患者更新 ──────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const { id } = await params;
  const body = await req.json();
  const { name, kana, phone, symptom, memo } = body;

  const updated = await prisma.patient.update({
    where: { id },
    data: {
      ...(name    !== undefined ? { name }    : {}),
      ...(kana    !== undefined ? { kana }    : {}),
      ...(phone   !== undefined ? { phone }   : {}),
      ...(symptom !== undefined ? { symptom } : {}),
      ...(memo    !== undefined ? { memo }    : {}),
    },
  });

  return NextResponse.json({ data: updated });
}

// ─── DELETE: 患者削除 ─────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const { id } = await params;
  await prisma.patient.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
