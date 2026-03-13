import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  const clinics = await prisma.clinic.findMany({
    select: { id: true, name: true, slug: true, color: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(clinics);
}
