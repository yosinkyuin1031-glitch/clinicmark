import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
// Canva デザインを作成して編集URLを返す
// CANVA_API_TOKEN 未設定時はフォールバックURL（Canva作成ページ）を返す
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

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

  // フォールバック：Canva作成ページURLを返す（テキストはクライアントでコピー済み）
  const fallbackUrl =
    CANVA_CREATE_URLS[designType as CanvaDesignPreset] ??
    'https://www.canva.com/create/';

  return NextResponse.json({ editUrl: fallbackUrl, mode: 'fallback' });
}

// GET /api/canva/design → Canva連携の有効状態を返す
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  return NextResponse.json({ enabled: isCanvaEnabled() });
}
