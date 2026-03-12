import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// ─── GET: 評価統計 ─────────────────────────────────────
// ?clinicId=xxx
// Returns: { goodByType, badByType, totalGood, totalBad }
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const clinicId = req.nextUrl.searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicIdが必要です' }, { status: 400 });

  // rating = 'good' または 'bad' のものを取得（noneは除外）
  const records = await prisma.generatedContent.findMany({
    where: {
      clinicId,
      rating: { in: ['good', 'bad'] },
    },
    select: { type: true, rating: true },
  });

  const goodByType: Record<string, number> = {};
  const badByType:  Record<string, number> = {};

  for (const r of records) {
    if (r.rating === 'good') {
      goodByType[r.type] = (goodByType[r.type] ?? 0) + 1;
    } else if (r.rating === 'bad') {
      badByType[r.type]  = (badByType[r.type]  ?? 0) + 1;
    }
  }

  const totalGood = Object.values(goodByType).reduce((s, n) => s + n, 0);
  const totalBad  = Object.values(badByType).reduce((s, n) => s + n, 0);

  return NextResponse.json({ goodByType, badByType, totalGood, totalBad });
}
