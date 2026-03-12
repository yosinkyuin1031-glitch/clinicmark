import { IS_MOCK_MODE } from '@/lib/ai/client';
import type { MediaType, MultiGenInput, OutputItem } from '@/types';
import { MEDIA_LABELS } from '@/types';

// ─── 医療広告NGワード定数 ─────────────────────────────────
const MEDICAL_NG_WORDS = [
  '完治', '治ります', '必ず治る', '100%改善', '絶対に効く',
  '完全に治る', '確実に効果', '必ず効果', '治療効果保証',
];

// ─── 生成コンテキスト ────────────────────────────────────
interface GenerationContext {
  clinicName:   string;
  brandContext: string;
  input:        MultiGenInput;
  goodExamples?: Partial<Record<string, string[]>>;  // 媒体タイプ → 高評価コンテンツ例
}

// ─── 文字量係数 ──────────────────────────────────────────
const CHAR_SCALE: Record<MultiGenInput['charCount'], number> = {
  short:  0.5,
  medium: 1.0,
  long:   1.5,
};

// ─── モックテンプレート（全19種） ────────────────────────
type TemplateFunc = (ctx: GenerationContext) => string;

const mockTemplates: Record<MediaType, TemplateFunc> = {
  // ── FAQ系 ───────────────────────────────────────────────
  faq: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || '患者様';
    const n = Math.min(Math.max(input.faqCount, 1), 10);
    const base = [
      `Q. ${s}の原因は何ですか？\nA. ${s}の原因はさまざまですが、主に日常生活の姿勢や筋肉のバランスの乱れが関係しています。${clinicName}では神経・筋肉・骨格の三つの観点から原因を丁寧に分析します。`,
      `Q. どのような施術を受けられますか？\nA. ${clinicName}では${t}に合わせたオーダーメイドの施術を提供しています。${input.theme}に特化したアプローチでお身体の状態を根本から見直していきます。`,
      `Q. 何回くらいで変化を感じられますか？\nA. 個人差はありますが、多くの方が3〜5回の施術で変化を感じられています。まず症状の程度を確認し、お一人おひとりに合ったペースでケアを進めていきます。`,
      `Q. 初めてでも大丈夫ですか？\nA. はい、もちろんです。初回は丁寧なカウンセリングを行い、お身体の状態やお悩みをじっくりお聞きします。不安なことは何でもご相談ください。`,
      `Q. 予約は必要ですか？\nA. ${clinicName}は完全予約制です。当日予約も可能ですので、お気軽にお電話またはWebからご予約ください。`,
      `Q. 施術時間はどのくらいですか？\nA. 初回は問診・カウンセリングを含めて約60〜90分が目安です。2回目以降は施術内容によって45〜60分程度となります。`,
      `Q. 保険は使えますか？\nA. ${clinicName}の施術は自費診療となります。詳しくはお気軽にお問い合わせください。`,
      `Q. ${s}の再発を防ぐためにはどうすればいいですか？\nA. 施術と並行して、日常生活での姿勢改善やセルフケアが大切です。${clinicName}では施術後のホームケアについても丁寧にアドバイスします。`,
      `Q. 子ども連れでも来院できますか？\nA. はい、お子様連れでもご来院いただけます。施術中のお子様については、スタッフがサポートしますのでご相談ください。`,
      `Q. キャンセルポリシーを教えてください。\nA. ご予約の変更・キャンセルは前日までにご連絡ください。当日キャンセルはご遠慮いただく場合がありますので、ご了承ください。`,
    ];
    return base.slice(0, n).join('\n\n');
  },

  faq_short: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const n = Math.min(Math.max(input.faqCount, 1), 10);
    const base = [
      `Q. ${s}に対応していますか？ → はい、${clinicName}では${s}の根本的な原因にアプローチした施術を提供しています。`,
      `Q. 料金はいくらですか？ → 初回は無料カウンセリングを実施。施術料金は状態を確認した上でご案内します。`,
      `Q. 予約方法は？ → 電話・Web・LINEから。当日予約も歓迎です。`,
      `Q. 施術時間は？ → 初回60〜90分、2回目以降45〜60分が目安です。`,
      `Q. 保険は使えますか？ → 自費診療となります。`,
      `Q. 何回通えばいいですか？ → 状態により異なりますが、3〜5回が目安です。`,
      `Q. 子ども連れOKですか？ → はい、対応しています。`,
      `Q. 駐車場はありますか？ → あります（台数制限あり）。`,
      `Q. 営業時間は？ → 平日10〜19時、土曜10〜17時（日祝休）。`,
      `Q. 男性でも施術を受けられますか？ → はい、性別問わずご来院いただけます。`,
    ];
    return base.slice(0, n).join('\n');
  },

  faq_meta_kw: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return [
      s, `${s}改善`, `${s}原因`, `${s}施術`,
      clinicName, input.theme,
      `${area}整体`, `${area}鍼灸`,
      '根本改善', 'カウンセリング無料', '完全予約制',
    ].join(', ');
  },

  // ── ブログ系 ─────────────────────────────────────────────
  blog_summary: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return `【記事要約】
テーマ: ${input.theme}
対象: ${input.target || '${s}に悩む方'}
地域: ${area}

この記事では、${s}の主な原因と${clinicName}が提供するアプローチを解説します。
日常生活でできるセルフケアも紹介し、読者が施術のイメージをつかめる構成にします。

想定文字数: ${CHAR_SCALE[input.charCount] >= 1.0 ? '1,500〜2,000字' : '〜1,000字'}
想定読者: ${input.target || `${s}で悩む方`}
キーワード: ${s}、${input.theme}、${clinicName}、${area}整体`;
  },

  blog_outline: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return `# ${input.theme}を根本から改善する方法【${clinicName}監修】

## はじめに
- ${s}で悩む方に向けたコンテンツ
- 読後にわかること：原因・セルフケア・専門的ケアの選び方

## 第1章: ${s}の主な原因
- 骨格のゆがみとは
- 筋肉バランスの乱れ
- 日常生活の姿勢が与える影響

## 第2章: よくある誤った対処法
- 痛み止めだけでは根本解決にならない理由
- 自己流ストレッチのリスク

## 第3章: ${clinicName}のアプローチ
- 神経・筋肉・骨格の三つの観点
- カウンセリングから施術までの流れ

## 第4章: ご自宅でできるセルフケア
- 推奨ストレッチ3選
- 日常生活で気をつけること

## まとめ
- ${s}は放置せず早めのケアを
- ${area}で${input.theme}なら${clinicName}へ`;
  },

  blog_body: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    const scale = CHAR_SCALE[input.charCount];
    const lengthNote = scale >= 1.5 ? '（詳細版）' : scale >= 1.0 ? '' : '（簡潔版）';
    return `## ${s}とは？その本当の原因を知ろう${lengthNote}

${s}は、現代人の多くが抱える悩みのひとつです。デスクワークの増加やスマートフォンの普及により、姿勢の悪化や運動不足が広がっていることが主な要因とされています。

${input.target ? `特に${input.target}の方は、` : ''}日常的な姿勢の崩れが積み重なることで、気づかないうちに${s}が慢性化してしまうケースが多く見られます。

## なぜ一般的な対処法では解決しないのか

市販の鎮痛剤や湿布は一時的な症状の緩和には役立ちますが、根本原因へのアプローチにはなりません。${s}の多くは、骨格のバランスの乱れや神経への圧迫が関係しており、これらを整えることが本質的な解決につながります。

## ${clinicName}が採用する施術アプローチ

${area}の${clinicName}では、${input.theme}に特化した独自のアプローチを採用しています。初回のカウンセリングで徹底的に原因を分析し、${input.target || '患者様'}お一人おひとりに合った施術プランをご提案します。

## ご自宅でできるセルフケア

施術と並行して日常生活での意識も重要です。

1. **正しい姿勢の保持**: デスクワーク中は背もたれを活用し、30分に一度は立ち上がりましょう
2. **適度なストレッチ**: 朝晩5分のストレッチで筋肉の柔軟性を保ちます
3. **睡眠環境の見直し**: 枕の高さや寝具の硬さも${s}に影響します

## ${clinicName}へのご相談はお気軽に

${s}でお悩みの方は、まずは${clinicName}の無料カウンセリングをご利用ください。${area}から通いやすい場所にあり、完全予約制で安心してご来院いただけます。`;
  },

  blog_seo_title: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return `【${s}の原因と改善法】${input.theme}を根本から解決｜${area}${clinicName}`;
  },

  blog_seo_desc: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return `${area}の${clinicName}が${s}の原因・改善方法・セルフケアを詳しく解説。${input.theme}に特化した施術で根本から改善。初回カウンセリング無料・完全予約制。`;
  },

  blog_meta_kw: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return [
      s, `${s}原因`, `${s}改善方法`, `${s}セルフケア`,
      `${input.theme}`, `${area}整体`, `${area}鍼灸`,
      clinicName, '根本改善', 'カウンセリング',
    ].join(', ');
  },

  blog_ogp_title: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    return `${s}でお悩みの方へ ― ${input.theme}完全ガイド｜${clinicName}`;
  },

  blog_ogp_desc: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return `${s}の原因から改善策まで${clinicName}が徹底解説。${area}で${input.theme}の根本改善を目指すなら当院へ。無料カウンセリング受付中。`;
  },

  // ── SEO/OGP（FAQ用） ─────────────────────────────────────
  seo_title: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return `【${s}FAQ】よくある質問と回答まとめ｜${area}${clinicName}`;
  },

  seo_desc: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || '患者様';
    const area = input.areaName || '大阪';
    return `${clinicName}が${s}に悩む${t}のよくある疑問にお答えします。原因・施術内容・料金・予約方法など${area}で${input.theme}をお考えの方は必見。`;
  },

  ogp_title: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    return `${s}FAQ ― よくある質問まとめ｜${clinicName}`;
  },

  ogp_desc: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const area = input.areaName || '大阪';
    return `${clinicName}の${input.theme}専門FAQページ。${s}の原因・施術・よくある質問をまとめました。${area}で根本改善を目指すなら当院へ。`;
  },

  // ── 集客系 ───────────────────────────────────────────────
  gmb: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'お悩みの方';
    const area = input.areaName || '大阪';
    return `${clinicName}からのお知らせ

${s}でお悩みの${t}へ。当院では${input.theme}に特化した施術を提供しています。骨格・神経・筋肉の三つのアプローチで、根本から原因にアプローチします。

✅ 初回カウンセリング無料
✅ 完全予約制・当日予約OK
✅ 駐車場完備

まずはお気軽にお問い合わせください。ご予約はお電話またはWebから承っています。

#${s} #${clinicName} #整体 #${area}`;
  },

  instagram: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'あなた';
    const area = input.areaName || '大阪';
    return `${s}に悩んでいませんか？🙋

毎日の${s}、もしかして「慣れ」で済ませていませんか？

${t}にとって、${s}は日常生活の質を大きく左右します。

${clinicName}では、あなたのお身体の状態を丁寧に確認しながら、一人ひとりに合ったケアを提案しています✨

▶ 初回カウンセリング無料
▶ 完全予約制・駐車場あり
▶ お子様連れOK

プロフィールのリンクからご予約いただけます💁

#${s} #整体 #${area}整体 #${clinicName} #根本改善 #${input.theme}`;
  },

  meta_ad: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'あなた';
    const area = input.areaName || '大阪';
    return `【案1 - 問題提起型】
ヘッドライン: 「その${s}、放置してませんか？」
本文: ${t}の${s}は、放っておくと慢性化してしまいます。${clinicName}では根本原因にアプローチ。初回カウンセリング無料！

【案2 - ベネフィット訴求型】
ヘッドライン: 「${s}から解放されたい方へ」
本文: ${clinicName}の独自アプローチで、多くの方が${s}の改善を実感。あなたも一歩踏み出してみませんか？

【案3 - 地域限定型】
ヘッドライン: 「${area}で${input.theme}なら${clinicName}」
本文: ${s}でお悩みの方、今すぐ無料相談へ。予約はWebから簡単にできます。`;
  },

  lp_hero: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'あなた';
    return `【案1 - シンプル訴求】
キャッチコピー: 「${input.theme}を、もう我慢しない。」
サブコピー: ${s}の根本原因にアプローチし、お身体の本来の状態を取り戻します。
CTA: 無料カウンセリングを予約する

【案2 - ターゲット絞り込み】
キャッチコピー: 「${t}のための、${clinicName}」
サブコピー: ${s}に特化した施術と、丁寧なカウンセリングで、あなたに合ったケアを提供します。
CTA: 今すぐ予約する（当日OK）

【案3 - 実績訴求】
キャッチコピー: 「${s}専門院、${clinicName}」
サブコピー: ${input.theme}の根本改善に特化し、多くの方にご来院いただいています。
CTA: 無料相談・ご予約はこちら`;
  },
};

// ─── 品質チェック（advisory only） ──────────────────────
function checkQuality(content: string, input: MultiGenInput): string[] {
  const warnings: string[] = [];

  // 1. 必須キーワードが含まれているか
  if (input.requiredKeywords.trim()) {
    const kws = input.requiredKeywords
      .split(/[\n,、]/)
      .map((k) => k.trim())
      .filter(Boolean);
    const missing = kws.filter((kw) => !content.includes(kw));
    if (missing.length > 0) {
      warnings.push(`必須KW未含: ${missing.join('、')}`);
    }
  }

  // 2. 避けたい表現が含まれていないか
  if (input.avoidExpressions.trim()) {
    const avoids = input.avoidExpressions
      .split(/[\n,、]/)
      .map((e) => e.trim())
      .filter(Boolean);
    const found = avoids.filter((expr) => content.includes(expr));
    if (found.length > 0) {
      warnings.push(`避けたい表現含む: ${found.join('、')}`);
    }
  }

  // 3. 医療広告NGワード
  const ngFound = MEDICAL_NG_WORDS.filter((ng) => content.includes(ng));
  if (ngFound.length > 0) {
    warnings.push(`医療広告NG表現: ${ngFound.join('、')}`);
  }

  return warnings;
}

// ─── LLM プロンプト生成（媒体別） ────────────────────────
function buildPromptForMedia(mediaType: MediaType, ctx: GenerationContext): string {
  const { clinicName, brandContext, input } = ctx;
  const s    = input.symptom || input.theme;
  const t    = input.target  || '患者様';
  const area = input.areaName || '地域';
  const n    = Math.min(Math.max(input.faqCount, 1), 10);

  const charGuide =
    input.charCount === 'short'  ? '短め（〜500字）' :
    input.charCount === 'medium' ? '標準（800〜1200字）' :
                                   '詳細（1500〜2500字）';

  const common = [
    `院名: ${clinicName}`,
    `テーマ: ${input.theme}`,
    `症状: ${s}`,
    `ターゲット: ${t}`,
    `地域: ${area}`,
    `ブランド情報: ${brandContext}`,
    input.requiredKeywords ? `必須キーワード: ${input.requiredKeywords}` : '',
    input.avoidExpressions ? `避けたい表現: ${input.avoidExpressions}` : '',
  ].filter(Boolean).join('\n');

  const instructions: Record<MediaType, string> = {
    faq:           `${n}件のFAQ（Q&A形式）を生成してください。各QAを空行で区切ること。${charGuide}`,
    faq_short:     `${n}件の簡潔なFAQ（「Q. 質問 → 短い回答」の一行形式）を生成してください。`,
    faq_meta_kw:   `FAQページ用のメタキーワードをカンマ区切りで10〜15個生成してください。`,
    blog_summary:  `ブログ記事の企画サマリー（テーマ・対象読者・構成案・キーワード等）を生成してください。`,
    blog_outline:  `ブログ記事の見出し構成をMarkdown（H1〜H3）形式で生成してください。`,
    blog_body:     `ブログ記事の本文を生成してください。${charGuide}。医療広告ガイドラインを遵守すること。`,
    blog_seo_title:`ブログ記事のSEOタイトルを1行（32字以内）で生成してください。`,
    blog_seo_desc: `ブログ記事のmeta descriptionを1〜2文（120字以内）で生成してください。`,
    blog_meta_kw:  `ブログ記事用のメタキーワードをカンマ区切りで10〜15個生成してください。`,
    blog_ogp_title:`ブログ記事のOGPタイトルを1行（40字以内）で生成してください。`,
    blog_ogp_desc: `ブログ記事のOGP説明文を1〜2文（90字以内）で生成してください。`,
    seo_title:     `FAQページのSEOタイトルを1行（32字以内）で生成してください。`,
    seo_desc:      `FAQページのmeta descriptionを1〜2文（120字以内）で生成してください。`,
    ogp_title:     `FAQページのOGPタイトルを1行（40字以内）で生成してください。`,
    ogp_desc:      `FAQページのOGP説明文を1〜2文（90字以内）で生成してください。`,
    gmb:           `Googleビジネスプロフィール投稿文（ハッシュタグ含む）を生成してください。${charGuide}`,
    instagram:     `Instagram投稿キャプション（絵文字・ハッシュタグ含む）を生成してください。${charGuide}`,
    meta_ad:       `Meta広告コピーを3案（案1〜3）生成してください。各案にヘッドラインと本文を含めること。`,
    lp_hero:       `LPファーストビュー（キャッチコピー・サブコピー・CTA）を3案生成してください。`,
  };

  // 高評価コンテンツ例（Few-shot）
  const examples = ctx.goodExamples?.[mediaType] ?? [];
  const exampleSection = examples.length > 0
    ? `\n【参考例：過去の高評価コンテンツ（${examples.length}件）】\n` +
      examples.map((ex, i) => `--- 例${i + 1} ---\n${ex}`).join('\n') +
      '\n上記を参考に、同等以上のクオリティで生成してください。'
    : '';

  return `あなたは日本の治療院マーケティングの専門家です。以下の条件でコンテンツを生成してください。

【条件】
${common}

【生成タスク】
${instructions[mediaType]}
${exampleSection}
医療広告ガイドライン（「治る」「完治」「必ず効く」等の断言表現禁止）を必ず遵守してください。本文のみを出力し、前後の説明やラベルは不要です。`;
}

// ─── LLM 差し替えポイント ─────────────────────────────────
// IS_MOCK_MODE=true  → mockTemplates[mediaType](ctx)
// IS_MOCK_MODE=false → buildPromptForMedia(mediaType, ctx) → generateText()
async function generateForMedia(
  mediaType: MediaType,
  ctx: GenerationContext,
): Promise<string> {
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 80 + Math.random() * 120));
    return mockTemplates[mediaType](ctx);
  }

  // ── 本番LLM ──────────────────────────────────────────
  const { generateText } = await import('@/lib/ai/client');
  const prompt = buildPromptForMedia(mediaType, ctx);

  try {
    const result = await generateText({ prompt, maxTokens: 2000 });
    return result.text.trim() || mockTemplates[mediaType](ctx);
  } catch {
    return mockTemplates[mediaType](ctx);
  }
}

// ─── 全媒体を並列生成 ─────────────────────────────────────
export async function generateAll(
  input:        MultiGenInput,
  brandContext: string,
  clinicName:   string,
  goodExamples?: Partial<Record<string, string[]>>,
): Promise<OutputItem[]> {
  const ctx: GenerationContext = { clinicName, brandContext, input, goodExamples };

  const results = await Promise.all(
    input.mediaTypes.map(async (mediaType) => {
      const content  = await generateForMedia(mediaType, ctx);
      const warnings = checkQuality(content, input);
      return {
        mediaType,
        label:     MEDIA_LABELS[mediaType],
        content,
        charCount: content.length,
        warnings,
      } satisfies OutputItem;
    }),
  );

  return results;
}
