import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateFlyerCopy } from '@/lib/ai/flyerGenerator';
import { prisma } from '@/lib/db/prisma';
import type { FlyerGenInput } from '@/types';

// ─── POST: チラシコピー AI 生成 ───────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json() as FlyerGenInput;
  if (!body.clinicId || !body.theme) {
    return NextResponse.json({ error: 'clinicId・themeは必須です' }, { status: 400 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: body.clinicId } });
  if (!clinic) return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });

  const copy = await generateFlyerCopy(body, clinic.name);
  return NextResponse.json({ data: copy });
}
