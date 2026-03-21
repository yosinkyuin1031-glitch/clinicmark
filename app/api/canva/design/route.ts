import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCanvaDesign,
  isCanvaEnabled,
  CANVA_CREATE_URLS,
  type CanvaDesignPreset,
} from '@/lib/canva/client';

const Schema = z.object({
  designType: z.string(),
  title:      z.string().optional(),
});

// POST /api/canva/design
export async function POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です' }, { status: 400 });
  }

  const { designType, title = 'ClinicMark コンテンツ' } = parsed.data;

  // Canva API が有効な場合：APIでデザイン作成
  if (isCanvaEnabled()) {
    try {
      const result = await createCanvaDesign(designType as CanvaDesignPreset, title);
      return NextResponse.json({ editUrl: result.editUrl, mode: 'api' });
    } catch (err) {
      console.error('[Canva API]', err);
      // API失敗時はフォールバック
    }
  }

  // フォールバック：Canva作成ページURLを返す
  const fallbackUrl =
    CANVA_CREATE_URLS[designType as CanvaDesignPreset] ??
    'https://www.canva.com/create/';

  return NextResponse.json({ editUrl: fallbackUrl, mode: 'fallback' });
}

// GET /api/canva/design → Canva連携の有効状態を返す
export async function GET() {
  return NextResponse.json({ enabled: isCanvaEnabled() });
}
