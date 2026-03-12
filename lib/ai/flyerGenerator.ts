import { IS_MOCK_MODE } from '@/lib/ai/client';
import type { FlyerGenInput, FlyerCopy } from '@/types';
import { buildBrandContext } from '@/lib/ai/buildPrompt';

// ─── モックデータ ──────────────────────────────────────
function mockFlyer(input: FlyerGenInput): FlyerCopy {
  const { theme, target, campaign } = input;
  return {
    catchCopy:   `${theme}でお悩みの方へ`,
    bodyText:    `${target || '患者様'}の${theme}、根本から解決しませんか？\n\n当院では一人ひとりの身体の状態を丁寧に分析し、オーダーメイドのケアを提供しています。\n\n✓ 初回カウンセリング無料\n✓ 完全予約制で待ち時間なし\n✓ 駐車場完備`,
    backText:    `${campaign ? `【キャンペーン情報】\n${campaign}\n\n` : ''}【院の特徴】\n・神経・筋肉・骨格の三つのアプローチ\n・症状の根本原因から改善\n・豊富な施術実績\n\n【アクセス】\nお電話またはWebからご予約ください。`,
    ctaText:     'QRコードからカンタン予約！',
    designNotes: `${input.flyerType}サイズ。メインビジュアルは笑顔のスタッフと患者のイメージ。院のブランドカラーを基調に清潔感を演出。文字は読みやすい大きさで。`,
  };
}

// ─── LLM プロンプト ────────────────────────────────────
function buildFlyerPrompt(input: FlyerGenInput, brandContext: string, clinicName: string): string {
  const toneGuide =
    input.tone === 'friendly' ? 'やわらかく親しみやすい口調' :
    input.tone === 'formal'   ? '丁寧でプロフェッショナルな口調' :
                                'カジュアルで話しかけるような口調';

  return `あなたは日本の治療院マーケティングの専門家です。以下の条件でチラシのコピーを生成してください。

【院情報】
院名: ${clinicName}
ブランド情報: ${brandContext}

【チラシ条件】
テーマ: ${input.theme}
種類: ${input.flyerType}
ターゲット: ${input.target || '症状に悩む患者様'}
${input.campaign ? `キャンペーン内容: ${input.campaign}` : ''}
文体: ${toneGuide}

【生成してください】
以下のJSON形式で出力してください（前後の説明不要、JSONのみ）:
{
  "catchCopy": "キャッチコピー（20字以内）",
  "bodyText": "表面の本文（改行\\nで表現、200字以内）",
  "backText": "裏面のテキスト（改行\\nで表現、200字以内）",
  "ctaText": "行動喚起文（例: QRコードからご予約）",
  "designNotes": "デザイン・画像に関する指示メモ（50字以内）"
}

医療広告ガイドライン（「治る」「必ず効く」等の断言表現禁止）を必ず遵守してください。`;
}

// ─── 生成メイン ────────────────────────────────────────
export async function generateFlyerCopy(
  input:       FlyerGenInput,
  clinicName:  string,
): Promise<FlyerCopy> {
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
    return mockFlyer(input);
  }

  const brandContext = await buildBrandContext(input.clinicId);
  const { generateText } = await import('@/lib/ai/client');
  const prompt = buildFlyerPrompt(input, brandContext, clinicName);

  try {
    const result = await generateText({ prompt, maxTokens: 1000 });
    const text = result.text.trim();
    // JSON部分を抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON not found');
    return JSON.parse(jsonMatch[0]) as FlyerCopy;
  } catch {
    return mockFlyer(input);
  }
}
