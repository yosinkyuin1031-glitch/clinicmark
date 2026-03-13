import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateLineScenario } from '@/lib/ai/lineScenarioGenerator';
import type { ScenarioGenInput } from '@/types';

export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body: ScenarioGenInput = await req.json();
  const { clinicId, scenarioType, theme, target, stepCount, tone } = body;

  if (!clinicId || !theme) {
    return NextResponse.json({ error: 'clinicId・themeは必須です' }, { status: 400 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });

  const steps = await generateLineScenario(
    { clinicId, scenarioType, theme, target: target ?? '', stepCount: stepCount ?? 3, tone: tone ?? 'friendly' },
    clinic.name,
  );

  return NextResponse.json({ data: { steps } });
}
