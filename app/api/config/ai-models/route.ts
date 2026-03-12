import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loadAiModels, refreshAiModels } from '@/lib/config/aiModels';

// GET /api/config/ai-models
// 現在のAIモデル設定を返す。lastChecked が7日以上前なら自動リフレッシュ
export async function GET() {
  try {
    const config = loadAiModels();

    // lastChecked が 7 日以上前なら自動でリフレッシュ
    const lastChecked = new Date(config._meta.lastChecked);
    const daysSince   = (Date.now() - lastChecked.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince >= 7) {
      // バックグラウンドでリフレッシュ（レスポンスはブロックしない）
      refreshAiModels().catch(() => {/* silent */});
    }

    return NextResponse.json(config);
  } catch {
    return NextResponse.json(
      { error: 'モデル設定の読み込みに失敗しました' },
      { status: 500 },
    );
  }
}

// POST /api/config/ai-models/refresh
// 即時リフレッシュ（管理者用）
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const result = await refreshAiModels();
    const config = loadAiModels();

    return NextResponse.json({
      ...result,
      config,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'リフレッシュに失敗しました' },
      { status: 500 },
    );
  }
}
