import { IS_MOCK_MODE } from './client';
import type { ImagePromptInput, ImagePromptOutput } from '@/types';

// ─── ユースケース別プラットフォーム説明 ────────────────
const USE_CASE_DESC: Record<ImagePromptInput['useCase'], string> = {
  instagram: 'Instagram フィード投稿用（正方形〜縦型）',
  youtube:   'YouTube サムネイル・ショート用',
  threads:   'Threads 投稿用',
  ad:        '広告バナー・SNS広告用',
};

// ─── ムード別画像ヒント ─────────────────────────────────
const MOOD_IMAGE_HINTS: Record<string, string> = {
  あたたかみ:       '暖色系（オレンジ・アイボリー）のライティング、柔らかいボケ感',
  清潔感:           '白・ライトグレーを基調とした清潔な空間、シャープなエッジ',
  プロフェッショナル: 'ニュートラルカラー、整然としたレイアウト、権威感のある構図',
  やわらかい:       'パステルカラー、自然光、丸みのある構図',
  元気:             '明るい昼光色、鮮やかなアクセントカラー、上を向いた人物',
};

// ─── スタイル別追加指示 ─────────────────────────────────
const STYLE_HINTS: Record<ImagePromptInput['style'], string> = {
  illustration: 'フラットイラスト、ベクター調、アニメ風ではなく清潔感のある医療系イラスト',
  photo:        'リアルな写真、プロフェッショナルなカメラアングル、自然な表情',
};

// ─── アスペクト比別構図ヒント ───────────────────────────
const RATIO_COMP: Record<ImagePromptInput['aspectRatio'], string> = {
  '16:9': '横長ワイドフレーム、左右バランスの取れた三分割構図',
  '1:1':  '正方形フレーム、中央配置またはオフセンターの視線誘導',
  '4:5':  '縦長構図、下部1/3に人物、上部に余白・キャッチコピー配置可',
  '9:16': '縦長ストーリーズ構図、上下で視線誘導、テキスト配置スペース確保',
};

// ─── バリエーション案 ───────────────────────────────────
function buildVariations(input: ImagePromptInput, clinicName: string): string[] {
  const base = input.theme || input.symptom;
  return [
    `${input.style === 'photo' ? '笑顔のスタッフと患者' : '施術中のイラスト'}をメインに、「${base}改善」の訴求。背景は${input.background || '院内'}`,
    `${base}で悩む人物の「before → after」イメージ（表情や姿勢の変化）を${input.style === 'photo' ? '写真' : 'イラスト'}で表現`,
    `${clinicName}のブランドカラーを基調に、シンプルな余白多めのミニマルデザイン。テキスト配置エリアを広めに確保`,
  ];
}

// ─── モック生成 ────────────────────────────────────────
function buildMockOutput(input: ImagePromptInput, clinicName: string): ImagePromptOutput {
  const base    = input.theme || input.symptom || 'テーマ';
  const moodHint = MOOD_IMAGE_HINTS[input.mood] ?? `${input.mood}の雰囲気`;
  const styleHint = STYLE_HINTS[input.style];
  const ratioHint = RATIO_COMP[input.aspectRatio];

  const humanNote = input.hasHuman
    ? `施術者・患者のいずれか（または両方）を${input.style === 'photo' ? '実写' : 'イラスト'}で含む。人物は白衣か清潔感のある服装。顔は自然な表情（無理な笑顔NG）`
    : '人物は含めない。物・空間・シンボルで${base}をビジュアル表現する';

  const mainPrompt = [
    `【用途】${USE_CASE_DESC[input.useCase]}`,
    `【テーマ】${base}の改善・ケア`,
    `【スタイル】${styleHint}`,
    `【雰囲気】${moodHint}`,
    `【背景】${input.background || '清潔感のある院内・白背景'}`,
    `【人物】${humanNote}`,
    `【アスペクト比】${input.aspectRatio}（${ratioHint}）`,
    `【院名参考】${clinicName} らしい信頼感・専門性を感じさせるビジュアル`,
  ].join('\n');

  return {
    mainPrompt,
    ngElements:       'テキスト・文字の重ね合わせ、過度な光エフェクト、暗い印象の照明、ぼやけた人物、医療機器の誇張表現、痛みを強調しすぎるビジュアル',
    noTextNote:       '画像内にテキストや文字は一切含めないこと。キャプションやウォーターマークも不要。テキストは別途デザインツールで追加する',
    compositionGuide: ratioHint + '。視線誘導を意識し、クリック率の高いサムネイル構成にする',
    colorDirection:   `${moodHint}を軸に配色。白・ライトグレーをベースとし、アクセントカラーは院のブランドカラー（青・緑系）を想定。彩度は控えめに`,
    variations:       buildVariations(input, clinicName),
  } satisfies ImagePromptOutput;
}

// ─── メイン関数 ────────────────────────────────────────
export async function generateImagePrompt(
  input:       ImagePromptInput,
  clinicName:  string,
): Promise<ImagePromptOutput> {
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
    return buildMockOutput(input, clinicName);
  }

  // ── 本番LLM ──────────────────────────────────────────
  const { generateText } = await import('./client');

  const moodHint  = MOOD_IMAGE_HINTS[input.mood] ?? `${input.mood}の雰囲気`;
  const styleHint = STYLE_HINTS[input.style];
  const ratioHint = RATIO_COMP[input.aspectRatio];
  const base      = input.theme || input.symptom;

  const prompt = `あなたは医療系クリニックの画像制作ディレクターです。以下の条件に基づき、AI画像生成ツール向けの詳細な指示文を作成してください。

【院名】${clinicName}
【用途】${USE_CASE_DESC[input.useCase]}
【テーマ・症状】${base}
【ムード】${input.mood}（参考: ${moodHint}）
【スタイル】${input.style === 'photo' ? 'リアル写真' : 'イラスト'}（参考: ${styleHint}）
【背景】${input.background || '清潔感のある院内・白背景'}
【人物】${input.hasHuman ? 'あり（施術者・患者等）' : 'なし（物・空間・シンボルで表現）'}
【アスペクト比】${input.aspectRatio}（${ratioHint}）

以下のJSON形式のみで回答してください（前後の説明・コードブロック不要）:
{
  "mainPrompt": "AIに渡す詳細な画像生成指示文（用途・テーマ・スタイル・ムード・背景・人物・構図を統合した指示）",
  "ngElements": "含めてはいけない要素をカンマ区切りで列挙",
  "noTextNote": "画像内テキスト不使用に関する注意文（1〜2文）",
  "compositionGuide": "構図・視線誘導の具体的な指示文",
  "colorDirection": "色味・配色方向性の指示文",
  "variations": ["バリエーション案1（視点や演出を変えた別案）", "バリエーション案2", "バリエーション案3"]
}`;

  try {
    const result = await generateText({ prompt, maxTokens: 1500 });
    const parsed = JSON.parse(result.text.trim()) as ImagePromptOutput;
    if (!parsed.mainPrompt || !Array.isArray(parsed.variations)) {
      throw new Error('invalid structure');
    }
    return parsed;
  } catch {
    return buildMockOutput(input, clinicName);
  }
}
