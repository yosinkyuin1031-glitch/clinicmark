import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import type { ContentStatus } from '@/types';

// ─── GET: ライブラリ一覧 ──────────────────────────────
export async function GET(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const clinicId = req.nextUrl.searchParams.get('clinicId');
  const type     = req.nextUrl.searchParams.get('type');
  const status   = req.nextUrl.searchParams.get('status') as ContentStatus | null;
  const rating   = req.nextUrl.searchParams.get('rating');
  const page     = parseInt(req.nextUrl.searchParams.get('page')  ?? '1');
  const limit    = parseInt(req.nextUrl.searchParams.get('limit') ?? '20');

  if (!clinicId) return NextResponse.json({ error: 'clinicIdが必要です' }, { status: 400 });

  const where = {
    clinicId,
    ...(type   ? { type }   : {}),
    ...(status ? { status } : {}),
    ...(rating ? { rating } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.generatedContent.count({ where }),
    prisma.generatedContent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id:          true,
        type:        true,
        title:       true,
        status:      true,
        rating:      true,
        tags:        true,
        inputParams: true,
        output:      true,
        note:        true,
        createdAt:   true,
        updatedAt:   true,
      },
    }),
  ]);

  return NextResponse.json({ data: items, total, page, limit });
}

// ─── PATCH: ステータス・メモ更新 ───────────────────────
const UpdateSchema = z.object({
  id:     z.string().cuid(),
  status: z.enum(['DRAFT', 'APPROVED', 'ARCHIVED']).optional(),
  note:   z.string().optional(),
  title:  z.string().min(1).optional(),
  tags:   z.array(z.string()).optional(),
});

export async function PATCH(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });

  const { id, tags, ...rest } = parsed.data;
  const data = { ...rest, ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}) };
  const content = await prisma.generatedContent.update({ where: { id }, data });
  return NextResponse.json({ data: content });
}
