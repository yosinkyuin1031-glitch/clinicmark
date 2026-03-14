import { NextResponse }         from 'next/server';
import { prisma }               from '@/lib/db/prisma';
import { buildBrandContext }    from '@/lib/ai/buildPrompt';
import { IS_MOCK_MODE }         from '@/lib/ai/client';
import { z }                    from 'zod';

// ─── バリデーション ──────────────────────────────────────
const schema = z.object({
  clinicId:     z.string().min(1),
  useCase:      z.enum(['instagram_post', 'instagram_story', 'youtube_thumb', 'threads', 'meta_ad']),
  theme:        z.string().min(1, 'テーマを入力してください'),
  imageStyle:   z.enum(['illustration', 'photorealistic', 'minimal', 'pop', 'japanese']),
  aspectRatio:  z.enum(['1:1', '9:16', '16:9', '4:5']),
  colorTone:    z.enum(['warm', 'cool', 'pastel', 'monotone', 'brand']),
  overlayText:  z.string().default(''),
  hasHuman:     z.boolean().default(true),
  background:   z.enum(['white', 'clinic', 'nature', 'gradient', 'texture']),
  extraNotes:   z.string().default(''),
});

export type ImageGenInput = z.infer<typeof schema>;

// ─── 定数マッピング ──────────────────────────────────────
const USE_CASE_DESC: Record<ImageGenInput['useCase'], string> = {
  instagram_post:  'Instagram フィード投稿（正方形 or 縦型）',
  instagram_story: 'Instagram ストーリーズ / リール（縦型フルスクリーン）',
  youtube_thumb:   'YouTube サムネイル（横長・インパクト重視）',
  threads:         'Threads 投稿（テキスト主体・添え画像）',
  meta_ad:         'Meta 広告バナー（クリック誘導・訴求力重視）',
};

const STYLE_DESC: Record<ImageGenInput['imageStyle'], { ja: string; en: string }> = {
  illustration:  { ja: 'フラットイラスト・ベクター調', en: 'flat vector illustration, clean line art, medical illustration style' },
  photorealistic: { ja: 'フォトリアル・プロ写真風', en: 'photorealistic, professional photography, high resolution, natural lighting' },
  minimal:       { ja: 'ミニマルデザイン・余白多め', en: 'minimalist design, lots of white space, simple composition, clean' },
  pop:           { ja: 'ポップ・カラフル・目を引く', en: 'colorful pop art style, vibrant, eye-catching, bold shapes' },
  japanese:      { ja: '和風テイスト・和モダン', en: 'Japanese aesthetic, wabi-sabi, zen garden, traditional Japanese colors, modern Japanese design' },
};

const COLOR_DESC: Record<ImageGenInput['colorTone'], { ja: string; en: string; palette: string[] }> = {
  warm:     { ja: '暖色系（オレンジ・アイボリー・ベージュ）', en: 'warm tones, orange, ivory, beige, amber', palette: ['#F97316', '#FDE68A', '#FFF7ED', '#D97706', '#FBBF24'] },
  cool:     { ja: '寒色系（ブルー・ネイビー・アクア）', en: 'cool tones, blue, navy, aqua, teal', palette: ['#3B82F6', '#1E3A5F', '#06B6D4', '#DBEAFE', '#0EA5E9'] },
  pastel:   { ja: 'パステルカラー（淡い色合い）', en: 'pastel colors, soft tones, light pink, light blue, lavender', palette: ['#F9A8D4', '#A5B4FC', '#BBF7D0', '#FDE68A', '#DDD6FE'] },
  monotone: { ja: 'モノトーン（白・グレー・黒）', en: 'monochrome, black and white, grayscale, high contrast', palette: ['#111827', '#4B5563', '#9CA3AF', '#D1D5DB', '#F9FAFB'] },
  brand:    { ja: 'ブランドカラー（院のテーマカラー基調）', en: 'brand colors, professional, trustworthy blue-green', palette: ['#2563EB', '#10B981', '#F0FDF4', '#DBEAFE', '#FFFFFF'] },
};

const BG_DESC: Record<ImageGenInput['background'], { ja: string; en: string }> = {
  white:    { ja: '白背景・クリーン', en: 'pure white background, clean, studio lighting' },
  clinic:   { ja: '院内・施術室', en: 'inside a clean modern clinic, treatment room, professional medical space' },
  nature:   { ja: '自然・屋外', en: 'outdoor nature background, green trees, sunlight, fresh air' },
  gradient: { ja: 'グラデーション背景', en: 'smooth gradient background, soft color transition' },
  texture:  { ja: 'テクスチャ（布・木目等）', en: 'textured background, linen texture, wood grain, subtle pattern' },
};

const RATIO_COMP: Record<ImageGenInput['aspectRatio'], string> = {
  '1:1':  'Square frame, centered composition or rule of thirds',
  '9:16': 'Vertical full-screen, top-bottom visual flow, text-safe zones at top and bottom',
  '16:9': 'Wide horizontal frame, balanced left-right composition, strong focal point',
  '4:5':  'Vertical feed format, subject in lower third, headline space at top',
};

// ─── モック出力 ──────────────────────────────────────────
function buildMockOutput(input: ImageGenInput, clinicName: string) {
  const style = STYLE_DESC[input.imageStyle];
  const color = COLOR_DESC[input.colorTone];
  const bg    = BG_DESC[input.background];
  const ratio = RATIO_COMP[input.aspectRatio];

  const humanEn = input.hasHuman
    ? 'A friendly therapist in clean uniform and a relaxed patient, natural expressions, warm interaction'
    : 'No human figures. Use abstract shapes, icons, or objects to represent the theme';

  const mainPromptEn = [
    `${style.en},`,
    `theme: ${input.theme} wellness and care,`,
    `${color.en},`,
    `background: ${bg.en},`,
    `${humanEn},`,
    `aspect ratio ${input.aspectRatio}, ${ratio},`,
    input.overlayText ? `space reserved for text overlay: "${input.overlayText}",` : '',
    `professional healthcare marketing image for ${USE_CASE_DESC[input.useCase]},`,
    `high quality, 4K, sharp details`,
    input.extraNotes ? `, ${input.extraNotes}` : '',
  ].filter(Boolean).join(' ');

  const mainPromptJa = [
    `【用途】${USE_CASE_DESC[input.useCase]}`,
    `【テーマ】${input.theme}`,
    `【スタイル】${style.ja}`,
    `【色味】${color.ja}`,
    `【背景】${bg.ja}`,
    `【人物】${input.hasHuman ? '施術者と患者を含む（自然な表情）' : '人物なし（オブジェクト・シンボルで表現）'}`,
    `【アスペクト比】${input.aspectRatio}`,
    input.overlayText ? `【テキスト挿入】「${input.overlayText}」を配置するスペースを確保` : '',
    `【院名】${clinicName}`,
    input.extraNotes ? `【追加指示】${input.extraNotes}` : '',
  ].filter(Boolean).join('\n');

  const negativePrompt = 'text, watermark, logo, blurry, low quality, deformed hands, extra fingers, cropped, out of frame, dark lighting, scary, blood, needles, medical gore, overly dramatic, anime style face, distorted anatomy';

  const compositionGuide = `${ratio}。視線誘導を意識し、メインの被写体を画面の${input.aspectRatio === '16:9' ? '左1/3' : '中央〜やや下'}に配置。${input.overlayText ? 'テキスト配置エリアを上部に確保。' : ''}背景は${bg.ja}で統一感を持たせる。`;

  const variations = [
    `${mainPromptEn.replace('high quality', 'cinematic lighting, depth of field, bokeh background')}`,
    `${mainPromptEn.replace('high quality', 'bird\'s eye view, flat lay composition, overhead angle')}`,
    `${mainPromptEn.replace('high quality', 'close-up detail shot, macro perspective, intimate feel')}`,
  ];

  return {
    mainPromptJa,
    mainPromptEn,
    negativePrompt,
    compositionGuide,
    colorPalette: color.palette,
    colorDescription: color.ja,
    variations,
  };
}

// ─── 本番LLM生成 ─────────────────────────────────────────
async function buildLLMOutput(input: ImageGenInput, clinicName: string) {
  const { generateText } = await import('@/lib/ai/client');
  const style = STYLE_DESC[input.imageStyle];
  const color = COLOR_DESC[input.colorTone];
  const bg    = BG_DESC[input.background];

  const prompt = `あなたは医療系クリニックの画像制作ディレクターです。以下の条件に基づき、AI画像生成ツール（Midjourney / DALL-E / Stable Diffusion）向けの詳細な指示文を作成してください。

【院名】${clinicName}
【用途】${USE_CASE_DESC[input.useCase]}
【テーマ】${input.theme}
【スタイル】${style.ja}（英語参考: ${style.en}）
【色味】${color.ja}（英語参考: ${color.en}）
【背景】${bg.ja}（英語参考: ${bg.en}）
【人物】${input.hasHuman ? 'あり（施術者・患者等）' : 'なし（物・空間・シンボルで表現）'}
【アスペクト比】${input.aspectRatio}
${input.overlayText ? `【テキスト挿入予定】「${input.overlayText}」` : ''}
${input.extraNotes ? `【追加指示】${input.extraNotes}` : ''}

以下のJSON形式のみで回答してください（前後の説明・コードブロック不要）:
{
  "mainPromptJa": "日本語での画像指示説明文",
  "mainPromptEn": "English prompt for AI image generation tool (detailed, comma-separated descriptors)",
  "negativePrompt": "English negative prompt (things to avoid, comma-separated)",
  "compositionGuide": "構図・視線誘導の具体的な指示文（日本語）",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"],
  "colorDescription": "配色の説明（日本語）",
  "variations": ["English variation prompt 1", "English variation prompt 2", "English variation prompt 3"]
}`;

  try {
    const result = await generateText({ prompt, maxTokens: 2000 });
    const parsed = JSON.parse(result.text.trim());
    if (!parsed.mainPromptEn || !Array.isArray(parsed.variations)) {
      throw new Error('invalid structure');
    }
    return parsed;
  } catch {
    return buildMockOutput(input, clinicName);
  }
}

// ─── POST ハンドラ ───────────────────────────────────────
export async function POST(req: Request) {
  try {
    const body   = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: '入力値が不正です', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // 院情報
    const clinic = await prisma.clinic.findUnique({ where: { id: input.clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });
    }

    // ブランドコンテキスト
    const brandContext = await buildBrandContext(input.clinicId);

    const start = Date.now();
    const output = IS_MOCK_MODE
      ? await (async () => { await new Promise(r => setTimeout(r, 500 + Math.random() * 400)); return buildMockOutput(input, clinic.name); })()
      : await buildLLMOutput(input, clinic.name);
    const durationMs = Date.now() - start;

    // 保存
    const saved = await prisma.generatedContent.create({
      data: {
        clinicId:    input.clinicId,
        templateId:  null,
        type:        'IMAGE_PROMPT',
        title:       `画像生成: ${input.theme}（${input.useCase}）`,
        inputParams: JSON.stringify({
          useCase:     input.useCase,
          theme:       input.theme,
          imageStyle:  input.imageStyle,
          aspectRatio: input.aspectRatio,
          colorTone:   input.colorTone,
          overlayText: input.overlayText,
          hasHuman:    String(input.hasHuman),
          background:  input.background,
          extraNotes:  input.extraNotes,
        }),
        output: output.mainPromptEn,
        status: 'DRAFT',
        tags:   JSON.stringify([input.useCase, 'image-gen']),
        note:   '',
      },
    });

    // プロンプトログ
    await prisma.promptLog.create({
      data: {
        clinicId:     input.clinicId,
        contentId:    saved.id,
        inputTokens:  0,
        outputTokens: output.mainPromptEn.length,
        durationMs,
        model:        IS_MOCK_MODE ? 'mock' : 'claude',
      },
    });

    return NextResponse.json(
      { contentId: saved.id, output, durationMs },
      { status: 201 },
    );
  } catch (e) {
    console.error('[image-gen]', e);
    return NextResponse.json({ error: '生成中にエラーが発生しました' }, { status: 500 });
  }
}
