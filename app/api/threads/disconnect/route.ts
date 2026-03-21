import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { clinicId } = await request.json();
  if (!clinicId) {
    return NextResponse.json({ error: 'clinicId required' }, { status: 400 });
  }

  await prisma.socialConnection.deleteMany({
    where: { clinicId, platform: 'threads' },
  });

  return NextResponse.json({ success: true });
}
