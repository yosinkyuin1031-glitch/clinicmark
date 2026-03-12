import { IS_MOCK_MODE } from '@/lib/ai/client';
import type { StoryGenInput, StorySlide } from '@/types';

// ─── CTA テキスト（強度別） ──────────────────────────────
const CTA_MAP: Record<1 | 2 | 3, string> = {
  1: 'プロフのリンクから詳細をチェック👇',
  2: 'まずはお気軽にご相談ください🙏',
  3: '今すぐ予約！限定枠あり⚡',
};

// ─── 気分別画像ベース指示 ────────────────────────────────
const MOOD_IMAGE_BASE: Record<StoryGenInput['mood'], string> = {
  warm: '温かみのある色調（オレンジ・ベージュ系）、木のぬくもりを感じる院内空間、自然光、スタッフの笑顔',
  cool: '清潔感のある白い空間（ホワイト・ライトグレー系）、ミニマルで洗練されたデザイン、プロフェッショナル感',
  pop:  '明るく鮮やかな色彩（ピンク・イエロー系）、元気でポジティブなビジュアル、インパクトのあるグラフィック',
  calm: '落ち着いた色調（グリーン・ブルー系）、ゆったりとした静かな空間、ナチュラルで安心感のある雰囲気',
};

// ─── ハッシュタグテンプレート ────────────────────────────
function buildHashtags(input: StoryGenInput): string[] {
  const { theme, target, clinicId: _ } = input;
  const area = '';
  const base = [
    `#${theme}`,
    '#整体',
    '#整骨院',
    '#治療院',
    '#体の悩み',
    '#健康管理',
    '#根本改善',
    '#姿勢改善',
    '#お体のお悩み',
    '#丁寧なカウンセリング',
    '#完全予約制',
    '#初回限定',
    '#おすすめ',
    '#ヘルスケア',
    '#お体のケア',
  ];
  const extra: string[] = [];
  if (target) extra.push(`#${target.slice(0, 8)}向け`);
  if (area)   extra.push(`#${area}整体`);
  return [...base, ...extra].slice(0, 15);
}

// ─── スライドごとのモックコンテンツ ──────────────────────
interface SlideTemplate {
  upperText:        (ctx: MockCtx) => string;
  imageInstruction: (ctx: MockCtx) => string;
  lowerText:        (ctx: MockCtx) => string;
  titleCandidates:  (ctx: MockCtx) => string[];
}

interface MockCtx {
  clinicName:  string;
  input:       StoryGenInput;
  brandContext: string;
}

// 汎用スライドテンプレート（最大7スライド分）
const SLIDE_TEMPLATES: SlideTemplate[] = [
  // page 1: フック（問題提起）
  {
    upperText: ({ input }) =>
      `「${input.theme}」でお悩みではありませんか？`,
    imageInstruction: ({ input }) =>
      `${MOOD_IMAGE_BASE[input.mood]}。${input.theme}で辛そうにしている人のイラストまたはシンプルなテキスト背景。${input.imageNotes ? `補足: ${input.imageNotes}` : ''}`,
    lowerText: ({ input }) =>
      `${input.target || 'つらい症状'}を我慢していませんか？実は多くの方が同じお悩みを抱えています。`,
    titleCandidates: ({ input }) => [
      `【${input.theme}】あなたも当てはまる？`,
      `これって${input.theme}のサイン…？`,
      `${input.theme}、放っておくと危険かも`,
    ],
  },
  // page 2: 原因
  {
    upperText: ({ input }) =>
      `${input.theme}の本当の原因`,
    imageInstruction: ({ input }) =>
      `${MOOD_IMAGE_BASE[input.mood]}。骨格や筋肉のバランスを示すシンプルな図解イメージ。${input.imageNotes ? `補足: ${input.imageNotes}` : ''}`,
    lowerText: () =>
      '日常生活の姿勢・筋肉のバランス・神経の働き…\n3つの要素が複合的に絡み合っています。',
    titleCandidates: ({ input }) => [
      `実は「${input.theme}」は○○が原因だった`,
      `知らなかった！${input.theme}の根本原因`,
      `${input.theme}が繰り返す理由がわかった`,
    ],
  },
  // page 3: 解決策
  {
    upperText: ({ clinicName }) =>
      `${clinicName}のアプローチ`,
    imageInstruction: ({ input }) =>
      `${MOOD_IMAGE_BASE[input.mood]}。施術シーン（施術者の手元と患者の背中）、プロフェッショナル感を強調。${input.imageNotes ? `補足: ${input.imageNotes}` : ''}`,
    lowerText: ({ input }) =>
      `神経・筋肉・骨格の三つの視点から根本にアプローチ。${input.theme}の原因を丁寧に見つけます。`,
    titleCandidates: ({ clinicName, input }) => [
      `${clinicName}が選ばれる理由`,
      `「${input.theme}」を根本から変える施術`,
      `他院と違う${clinicName}のメソッド`,
    ],
  },
  // page 4: 実績・お客様の声
  {
    upperText: () =>
      'ご来院された方の声',
    imageInstruction: ({ input }) =>
      `${MOOD_IMAGE_BASE[input.mood]}。お客様の満足した表情・笑顔。個人が特定できないようにシルエットや後ろ姿で表現。${input.imageNotes ? `補足: ${input.imageNotes}` : ''}`,
    lowerText: ({ input }) =>
      `「${input.theme}が楽になって日常生活が変わりました」\nたくさんのお喜びの声をいただいています。`,
    titleCandidates: ({ input }) => [
      `${input.theme}が改善した方の声`,
      `こんなお客様が通われています`,
      `リピーターが多い理由がわかりました`,
    ],
  },
  // page 5: 特徴・安心ポイント
  {
    upperText: ({ clinicName }) =>
      `${clinicName}の安心ポイント`,
    imageInstruction: ({ input }) =>
      `${MOOD_IMAGE_BASE[input.mood]}。清潔で広々とした院内の全景。受付や待合スペースが見えると好印象。${input.imageNotes ? `補足: ${input.imageNotes}` : ''}`,
    lowerText: () =>
      '✅ 完全予約制\n✅ 丁寧なカウンセリング\n✅ お体に合ったオーダーメイド施術',
    titleCandidates: ({ clinicName }) => [
      `${clinicName}に安心して来られる理由`,
      `初めての方も安心！3つのポイント`,
      `なぜ${clinicName}が選ばれるのか`,
    ],
  },
  // page 6: Q&A
  {
    upperText: () =>
      'よくある質問',
    imageInstruction: ({ input }) =>
      `${MOOD_IMAGE_BASE[input.mood]}。シンプルなQ&Aデザイン背景、または親しみやすいスタッフの写真。${input.imageNotes ? `補足: ${input.imageNotes}` : ''}`,
    lowerText: () =>
      'Q. 初回はどのくらいかかる？\nA. 約60〜90分（カウンセリング込み）\n\nQ. 予約は必要？\nA. 完全予約制です。お電話・Webでご予約ください。',
    titleCandidates: () => [
      '来院前の疑問を解消！',
      '初めての方へ：よくあるご質問',
      'こんな疑問、ありませんか？',
    ],
  },
  // page 7: CTA
  {
    upperText: () =>
      'まずはご相談ください',
    imageInstruction: ({ input }) =>
      `${MOOD_IMAGE_BASE[input.mood]}。スタッフが笑顔で迎えている玄関や受付の雰囲気写真。温かみと清潔感を両立。${input.imageNotes ? `補足: ${input.imageNotes}` : ''}`,
    lowerText: () =>
      '・初回限定メニューあり\n・完全予約制で待ち時間なし\n・プロフのリンクから簡単予約',
    titleCandidates: () => [
      '一緒に解決しましょう！',
      'お待ちしています',
      '今日から変えていきましょう',
    ],
  },
];

// ─── フィード投稿用（1スライド）────────────────────────
function buildFeedSlide(ctx: MockCtx): StorySlide {
  return {
    page: 1,
    upperText:        `${ctx.input.theme}でお悩みの方へ`,
    imageInstruction: `${MOOD_IMAGE_BASE[ctx.input.mood]}。${ctx.input.theme}に関連するメインビジュアル。テキストなしで画像だけで魅力が伝わるもの。${ctx.input.imageNotes ? `補足: ${ctx.input.imageNotes}` : ''}`,
    lowerText:        `${ctx.input.target || '症状でお悩みの方'}の根本改善を${ctx.clinicName}がサポートします。\n神経・筋肉・骨格の三つの視点でアプローチし、再発しにくいお体づくりをお手伝いします。\nまずはお気軽にご相談ください。\n\n${CTA_MAP[ctx.input.ctaStrength]}`,
    titleCandidates:  [
      `【${ctx.input.theme}】根本から変えたい方へ`,
      `${ctx.input.theme}を諦めないで`,
      `あなたの${ctx.input.theme}を解決する方法`,
    ],
    ctaText: CTA_MAP[ctx.input.ctaStrength],
    hashtags: buildHashtags(ctx.input),
  };
}

// ─── リール用（1スライド台本）──────────────────────────
function buildReelSlide(ctx: MockCtx): StorySlide {
  const { clinicName, input } = ctx;
  return {
    page: 1,
    upperText:        `【リール台本】${input.theme}`,
    imageInstruction: `${MOOD_IMAGE_BASE[input.mood]}。縦型動画（9:16）。冒頭3秒でフック（テキストオーバーレイ「${input.theme}で悩んでいませんか？」）→ 院内映像 → スタッフ施術シーン → CTAテキスト。${input.imageNotes ? `補足: ${input.imageNotes}` : ''}`,
    lowerText: [
      `【0-3秒】フック：「${input.theme}、諦めていませんか？」`,
      `【3-8秒】問題提起：日常生活への影響を提示`,
      `【8-15秒】解決策：${clinicName}のアプローチ紹介`,
      `【15-20秒】実績・安心感：お客様の変化`,
      `【20-25秒】CTA：${CTA_MAP[input.ctaStrength]}`,
    ].join('\n'),
    titleCandidates:  [
      `${input.theme}を解決する方法【リール】`,
      `知らなかった！${input.theme}の原因と対策`,
      `${clinicName}が教える${input.theme}ケア`,
    ],
    ctaText: CTA_MAP[input.ctaStrength],
    hashtags: buildHashtags(input),
  };
}

// ─── メイン生成関数 ──────────────────────────────────────
export async function generateStory(
  input:        StoryGenInput,
  brandContext: string,
  clinicName:   string,
): Promise<StorySlide[]> {
  // ── 本番LLM ──────────────────────────────────────────
  if (!IS_MOCK_MODE) {
    try {
      const { generateText } = await import('@/lib/ai/client');

      const slideNum =
        input.postType === 'story'
          ? Math.min(Math.max(input.slideCount, 1), 7)
          : 1;
      const moodDesc     = MOOD_IMAGE_BASE[input.mood];
      const postTypeLabel =
        input.postType === 'story' ? 'ストーリーズ' :
        input.postType === 'feed'  ? 'フィード投稿' : 'リール台本';

      const prompt = `あなたはInstagramコンテンツ制作のプロです。日本の治療院向けInstagram${postTypeLabel}（${slideNum}スライド分）の台本を生成してください。

【院名】${clinicName}
【テーマ】${input.theme}
【ターゲット】${input.target || '症状でお悩みの方'}
【ムード】${input.mood}（画像参考: ${moodDesc}）
【CTA強度】${input.ctaStrength}（1:柔らか〜3:強め）
【ブランド情報】${brandContext}
${input.imageNotes ? `【画像メモ】${input.imageNotes}` : ''}

以下のJSON配列のみで回答してください（コードブロック・前置き説明不要）:
[
  {
    "page": 1,
    "upperText": "上段テキスト（短く・インパクト重視）",
    "imageInstruction": "画像生成AI向けの詳細な画像指示文（${moodDesc}を基調に）",
    "lowerText": "下段リード文（共感・情報・行動喚起）",
    "titleCandidates": ["タイトル案1", "タイトル案2", "タイトル案3"],
    "ctaText": "最終スライドのみCTAテキスト、他は空文字\"\"",
    "hashtags": ["#タグ（最終スライドのみ10〜15個、他は空配列[]）"]
  }
]
${slideNum}スライド分を同じJSON配列に含めてください。`;

      const result = await generateText({ prompt, maxTokens: 3000 });
      const parsed = JSON.parse(result.text.trim()) as StorySlide[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // フォールバックへ
    }
  }

  // ── モック or フォールバック ──────────────────────────
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
  }

  const ctx: MockCtx = { clinicName, input, brandContext };

  if (input.postType === 'feed') {
    return [buildFeedSlide(ctx)];
  }

  if (input.postType === 'reel') {
    return [buildReelSlide(ctx)];
  }

  // story: slideCount 枚分
  const count = Math.min(Math.max(input.slideCount, 1), 7);
  const slides: StorySlide[] = [];

  for (let i = 0; i < count; i++) {
    const tpl    = SLIDE_TEMPLATES[i];
    const isLast = i === count - 1;
    slides.push({
      page:             i + 1,
      upperText:        tpl.upperText(ctx),
      imageInstruction: tpl.imageInstruction(ctx),
      lowerText:        tpl.lowerText(ctx),
      titleCandidates:  tpl.titleCandidates(ctx),
      ctaText:          isLast ? CTA_MAP[input.ctaStrength] : '',
      hashtags:         isLast ? buildHashtags(input) : [],
    });
  }

  return slides;
}
