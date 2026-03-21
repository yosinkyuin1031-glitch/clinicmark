import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { IS_MOCK_MODE } from '@/lib/ai/client';

const Schema = z.object({
  canvaUrl:     z.string().url(),
  instructions: z.string().min(1).max(1000),
});

// CanvaのデザインURLからDesign IDを抽出
function extractDesignId(url: string): string | null {
  const match = url.match(/\/design\/(D[a-zA-Z0-9_-]{10})/);
  return match?.[1] ?? null;
}

// ─── Claude でキャンバ編集プランを生成 ──────────────────────
async function buildEditPlan(instructions: string): Promise<string> {
  if (IS_MOCK_MODE) {
    return [
      `① テキスト要素を選択`,
      `   → 変更箇所: 「${instructions.slice(0, 30)}」に合わせてテキストをクリックして選択`,
      `② ダブルクリックしてテキスト編集モードへ`,
      `   → 指示内容に従って文字を書き換える（フォント・色はそのまま）`,
      `③ 画像の差し替えが必要な場合`,
      `   → 対象画像を右クリック →「画像を置き換え」→ 新しい画像をアップロード`,
      `④ 変更内容を確認後、右上の「共有」ボタンから書き出し`,
      `⑤ PNG/PDF形式でダウンロード`,
    ].join('\n');
  }

  const { generateText } = await import('@/lib/ai/client');
  const prompt = `あなたはCanvaデザイン編集の専門家です。
以下の変更指示を、Canva上で実行できる具体的な操作手順に変換してください。

【変更指示】
${instructions}

【出力条件】
- 番号付きリスト形式（①②③...）で5〜7ステップ
- 各ステップは「操作対象 → 具体的な操作内容」で記述
- テキスト変更・画像差し替え・色変更など種類別に分けて記述
- Canvaの実際のUI操作名を使う（「ダブルクリック」「右クリック」「置き換え」等）
- 日本語で出力`;

  try {
    const result = await generateText({ prompt, maxTokens: 600 });
    return result.text.trim();
  } catch {
    return buildEditPlan(instructions); // フォールバック
  }
}

// ─── Canva API でデザイン情報を取得 ─────────────────────────
async function fetchDesignInfo(designId: string): Promise<{ title?: string; pageCount?: number } | null> {
  const token = process.env.CANVA_API_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`https://api.canva.com/rest/v1/designs/${designId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title:     data.design?.title,
      pageCount: data.design?.page_count,
    };
  } catch {
    return null;
  }
}

// POST /api/tools/image-remix/canva
export async function POST(req: NextRequest) {
  // const session = await getServerSession(authOptions); // 認証一時無効
  // if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 }); // 認証一時無効

  const body   = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: '入力値が不正です', details: parsed.error.flatten() }, { status: 400 });
  }

  const { canvaUrl, instructions } = parsed.data;

  // デザインID抽出
  const designId = extractDesignId(canvaUrl);
  if (!designId) {
    return NextResponse.json(
      { error: '有効なCanvaデザインURLを入力してください（例: https://www.canva.com/design/DABcd.../edit）' },
      { status: 400 },
    );
  }

  // 並列取得
  const [editPlan, designInfo] = await Promise.all([
    buildEditPlan(instructions),
    fetchDesignInfo(designId),
  ]);

  const editUrl = `https://www.canva.com/design/${designId}/edit`;

  return NextResponse.json({
    editUrl,
    editPlan,
    designId,
    designTitle: designInfo?.title ?? null,
    pageCount:   designInfo?.pageCount ?? null,
  });
}
