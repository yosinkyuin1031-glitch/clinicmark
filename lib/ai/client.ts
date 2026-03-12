import Anthropic from '@anthropic-ai/sdk';
import { getMockResponse } from './mock';

// ─── モードチェック ────────────────────────────────────────
// ANTHROPIC_API_KEY が未設定 or プレースホルダーの場合はモック動作
// 本物のキーは "sk-ant-api03-..." の形式で80文字以上
const API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
export const IS_MOCK_MODE =
  !API_KEY ||
  API_KEY === '' ||
  API_KEY.endsWith('...') ||       // "sk-ant-..." などのプレースホルダー
  API_KEY.length < 40 ||           // 短すぎるキーは本物ではない
  !API_KEY.startsWith('sk-ant-');  // Anthropic キーの prefix チェック

// シングルトン Anthropic クライアント（本番時のみ初期化）
const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export const anthropic =
  IS_MOCK_MODE
    ? null
    : (globalForAnthropic.anthropic ??
        new Anthropic({ apiKey: API_KEY }));

if (!IS_MOCK_MODE && process.env.NODE_ENV !== 'production') {
  globalForAnthropic.anthropic = anthropic as Anthropic;
}

// ─── AI生成コア関数 ────────────────────────────────────
export interface GenerateTextOptions {
  prompt: string;
  maxTokens?: number;
  model?: string;
  /** モック時にテンプレートIDと入力値を渡すと内容に沿ったダミーを返す */
  _mockMeta?: { templateId: string; inputs: Record<string, string> };
}

export interface GenerateTextResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

export async function generateText({
  prompt,
  maxTokens = 2000,
  model = 'claude-sonnet-4-5',
  _mockMeta,
}: GenerateTextOptions): Promise<GenerateTextResult> {
  // ── モックモード ────────────────────────────────────
  if (IS_MOCK_MODE) {
    // 実際のAPIっぽい遅延を入れる（500〜900ms）
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
    return getMockResponse(
      _mockMeta?.templateId ?? '',
      _mockMeta?.inputs    ?? {},
    );
  }

  // ── 本番モード ──────────────────────────────────────
  const startTime = Date.now();

  const response = await (anthropic as Anthropic).messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
    system: `あなたは日本の治療院（整体院・鍼灸院）のマーケティング専門家です。
以下のルールを必ず守ってください：
1. 「治る」「完治」「効果がある（断言形）」などの医療広告ガイドライン違反の表現は使わない
2. 患者個人情報（氏名・住所・電話番号等）は一切扱わない
3. 指定された院のブランドトーンに合わせた文章を生成する
4. 日本語で出力する`,
  });

  const durationMs = Date.now() - startTime;
  const textContent = response.content.find((c) => c.type === 'text');

  return {
    text:         textContent?.text ?? '',
    inputTokens:  response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    durationMs,
  };
}
