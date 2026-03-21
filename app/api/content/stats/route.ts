import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/content/stats?clinicId=xxx
// Returns: { total, byStatus, byType, goodByType, badByType, totalGood, totalBad }
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const clinicId = req.nextUrl.searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicIdが必要です' }, { status: 400 });

  const [allContents, ratedContents] = await Promise.all([
    prisma.generatedContent.findMany({
      where:  { clinicId },
      select: { status: true, type: true },
    }),
    prisma.generatedContent.findMany({
      where:  { clinicId, rating: { in: ['good', 'bad'] } },
      select: { type: true, rating: true },
    }),
  ]);

  // ステータス集計
  const byStatus: Record<string, number> = {};
  for (const r of allContents) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  // タイプ別件数
  const byType: Record<string, number> = {};
  for (const r of allContents) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
  }

  // 評価集計
  const goodByType: Record<string, number> = {};
  const badByType:  Record<string, number> = {};
  for (const r of ratedContents) {
    if (r.rating === 'good') goodByType[r.type] = (goodByType[r.type] ?? 0) + 1;
    else if (r.rating === 'bad') badByType[r.type] = (badByType[r.type] ?? 0) + 1;
  }

  const totalGood = Object.values(goodByType).reduce((s, n) => s + n, 0);
  const totalBad  = Object.values(badByType).reduce((s, n) => s + n, 0);

  return NextResponse.json({
    total: allContents.length,
    byStatus,
    byType,
    goodByType,
    badByType,
    totalGood,
    totalBad,
  });
}
