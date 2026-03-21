import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/threads/status?clinicId=xxx
// Threads 連携状態を返す
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicId が必要です' }, { status: 400 });

  const connection = await prisma.socialConnection.findUnique({
    where:  { clinicId_platform: { clinicId, platform: 'threads' } },
    select: { isActive: true, username: true, expiresAt: true },
  });

  if (!connection || !connection.isActive) {
    return NextResponse.json({ connected: false });
  }

  const isExpired = connection.expiresAt ? connection.expiresAt < new Date() : false;
  return NextResponse.json({
    connected:      !isExpired,
    username:       connection.username,
    tokenExpiresAt: connection.expiresAt,
    isExpired,
  });
}
