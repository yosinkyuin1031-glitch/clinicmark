import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { buildBrandContext } from '@/lib/ai/buildPrompt';
import { generateReviewGuidance } from '@/lib/ai/reviewPageGenerator';
import { z } from 'zod';

const schema = z.object({
  clinicId:           z.string().min(1),
  googleUrl:          z.string().url('Google口コミURLを正しく入力してください'),
  hotpepperUrl:       z.string().default(''),
  positiveThreshold:  z.number().min(1).max(5).default(4),
  regenerate:         z.boolean().default(false),
});

// ─── GET: 現在の設定取得 ─────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const clinicId = req.nextUrl.searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicId が必要です' }, { status: 400 });

  const content = await prisma.generatedContent.findFirst({
    where:   { clinicId, type: 'REVIEW_PAGE_CONFIG' },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: content ? JSON.parse(content.output) : null });
}

// ─── POST: 設定保存 + 案内文生成 ─────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { clinicId, googleUrl, hotpepperUrl, positiveThreshold } = parsed.data;

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });

  const brandContext = await buildBrandContext(clinicId);
  const texts = await generateReviewGuidance(clinic.name, !!hotpepperUrl, brandContext);

  const config = {
    clinicId,
    clinicName:           clinic.name,
    clinicSlug:           clinic.slug,
    googleUrl,
    hotpepperUrl,
    positiveThreshold,
    ...texts,
    reviewPageUrl:        `/review/${clinic.slug}`,
    qrUrl:                `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/review/${clinic.slug}`)}`,
    updatedAt:            new Date().toISOString(),
  };

  // 既存設定を更新 or 新規作成
  const existing = await prisma.generatedContent.findFirst({
    where: { clinicId, type: 'REVIEW_PAGE_CONFIG' },
  });

  if (existing) {
    await prisma.generatedContent.update({
      where: { id: existing.id },
      data:  { output: JSON.stringify(config) },
    });
  } else {
    await prisma.generatedContent.create({
      data: {
        clinicId,
        type:        'REVIEW_PAGE_CONFIG',
        title:       `口コミ収集ページ設定（${clinic.name}）`,
        inputParams: JSON.stringify({ googleUrl, hotpepperUrl, positiveThreshold }),
        output:      JSON.stringify(config),
        status:      'APPROVED',
        rating:      'none',
        tags:        '[]',
        note:        '',
      },
    });
  }

  return NextResponse.json({ data: config });
}
