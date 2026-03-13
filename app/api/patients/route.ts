import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createSchema = z.object({
  clinicId: z.string().min(1),
  name:     z.string().min(1, '患者名を入力してください'),
  kana:     z.string().default(''),
  phone:    z.string().default(''),
  symptom:  z.string().default(''),
  memo:     z.string().default(''),
});

// ─── GET: 患者一覧 ────────────────────────────────────────
export async function GET(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const clinicId = req.nextUrl.searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicId が必要です' }, { status: 400 });

  const patients = await prisma.patient.findMany({
    where:   { clinicId },
    include: { visits: { orderBy: { visitedAt: 'desc' }, take: 1 } },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ data: patients });
}

// ─── POST: 患者作成 ───────────────────────────────────────
export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { clinicId, name, kana, phone, symptom, memo } = parsed.data;

  const patient = await prisma.patient.create({
    data: { clinicId, name, kana, phone, symptom, memo },
  });

  return NextResponse.json({ data: patient });
}
