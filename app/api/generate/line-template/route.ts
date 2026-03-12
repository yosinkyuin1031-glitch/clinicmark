import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateLineTemplate } from '@/lib/ai/lineTemplateGenerator';
import { prisma } from '@/lib/db/prisma';
import type { LineTemplateGenInput } from '@/types';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json() as LineTemplateGenInput;
  if (!body.clinicId || !body.category) {
    return NextResponse.json({ error: 'clinicId・categoryは必須です' }, { status: 400 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: body.clinicId } });
  if (!clinic) return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });

  const message = await generateLineTemplate(body, clinic.name);
  return NextResponse.json({ data: { message } });
}
