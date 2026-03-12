import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  getOrCreateProfile,
  upsertProfile,
  exportProfileAsJson,
} from '@/lib/services/brandProfile';

// ─── GET: プロフィール取得（?clinicId=xxx）
//         JSON エクスポート（?clinicId=xxx&export=json）
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get('clinicId');
  const isExport = searchParams.get('export') === 'json';

  if (!clinicId) {
    return NextResponse.json({ error: 'clinicId が必要です' }, { status: 400 });
  }

  if (isExport) {
    const data = await exportProfileAsJson(clinicId);
    return NextResponse.json(data);
  }

  const profile = await getOrCreateProfile(clinicId);
  return NextResponse.json(profile);
}

// ─── PUT: プロフィール保存
const PutSchema = z.object({
  clinicId: z.string().min(1),
  description:        z.string().optional(),
  brandTone:          z.string().optional(),
  primaryKeywords:    z.string().optional(),
  areaKeywords:       z.string().optional(),
  greeting:           z.string().optional(),
  ctaText:            z.string().optional(),
  recommendedPhrases: z.string().optional(),
  forbiddenPhrases:   z.string().optional(),
  notes:              z.string().optional(),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const body = await req.json();
  const parsed = PutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'バリデーションエラー', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { clinicId, ...fields } = parsed.data;
  const profile = await upsertProfile(clinicId, fields);
  return NextResponse.json(profile);
}
