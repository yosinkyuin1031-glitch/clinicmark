import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const Schema = z.object({
  rating: z.enum(['good', 'bad', 'none']),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  const { id } = await params;

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '不正なリクエストです', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // レコード存在確認
  const content = await prisma.generatedContent.findUnique({ where: { id } });
  if (!content) {
    return NextResponse.json({ error: 'コンテンツが見つかりません' }, { status: 404 });
  }

  // rating を更新
  const updated = await prisma.generatedContent.update({
    where: { id },
    data:  { rating: parsed.data.rating },
    select: { id: true, rating: true },
  });

  return NextResponse.json(updated, { status: 200 });
}
