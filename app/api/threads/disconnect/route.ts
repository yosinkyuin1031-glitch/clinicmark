import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

// DELETE /api/threads/disconnect
// Threads 連携を解除
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicId が必要です' }, { status: 400 });

  await prisma.socialConnection.updateMany({
    where: { clinicId, platform: 'threads' },
    data:  { isActive: false },
  });

  return NextResponse.json({ success: true });
}
