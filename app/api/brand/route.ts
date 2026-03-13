import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { BrandCategory } from '@/types';

// ─── バリデーションスキーマ ───────────────────────────
const CreateSchema = z.object({
  clinicId: z.string().cuid(),
  category: z.enum(['TONE','TARGET','SERVICE','KEYWORD','TAGLINE','NG_WORD']),
  key:      z.string().min(1).max(100),
  value:    z.string().min(1),
  order:    z.number().int().optional().default(0),
});

const UpdateSchema = z.object({
  id:       z.string().cuid(),
  key:      z.string().min(1).max(100).optional(),
  value:    z.string().min(1).optional(),
  order:    z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const DeleteSchema = z.object({
  id: z.string().cuid(),
});

// ─── GET: 院のブランド辞書一覧取得 ─────────────────────
export async function GET(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const clinicId  = req.nextUrl.searchParams.get('clinicId');
  const category  = req.nextUrl.searchParams.get('category') as BrandCategory | null;

  if (!clinicId) {
    return NextResponse.json({ error: 'clinicIdが必要です' }, { status: 400 });
  }

  const entries = await prisma.brandEntry.findMany({
    where: {
      clinicId,
      ...(category ? { category } : {}),
      isActive: true,
    },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });

  return NextResponse.json({ data: entries });
}

// ─── POST: 新規エントリ作成 ────────────────────────────
export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await prisma.brandEntry.create({ data: parsed.data });
  return NextResponse.json({ data: entry }, { status: 201 });
}

// ─── PATCH: 更新 ──────────────────────────────────────
export async function PATCH(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, ...data } = parsed.data;
  const entry = await prisma.brandEntry.update({ where: { id }, data });
  return NextResponse.json({ data: entry });
}

// ─── DELETE: 論理削除（isActive = false） ─────────────
export async function DELETE(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = DeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });
  }

  await prisma.brandEntry.update({
    where: { id: parsed.data.id },
    data:  { isActive: false },
  });

  return NextResponse.json({ data: { success: true } });
}
