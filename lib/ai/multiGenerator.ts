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

// ─── モックテンプレート（全9種） ─────────────────────────
type TemplateFunc = (ctx: GenerationContext) => string;

const mockTemplates: Record<MediaType, TemplateFunc> = {
  // ── Instagram ─────────────────────────────────────────
  instagram: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'あなた';
    const area = input.areaName || '大阪';
    return `${s}に悩んでいませんか？

毎日の${s}、もしかして「慣れ」で済ませていませんか？

${t}にとって、${s}は日常生活の質を大きく左右します。

${clinicName}では、あなたのお身体の状態を丁寧に確認しながら、一人ひとりに合ったケアを提案しています

▶ 初回カウンセリング無料
▶ 完全予約制・駐車場あり
▶ お子様連れOK

プロフィールのリンクからご予約いただけます

#${s} #整体 #${area}整体 #${clinicName} #根本改善 #${input.theme} #健康 #ボディケア #セルフケア`;
  },

  instagram_story: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'あなた';
    return `【ストーリーズ テキスト】

スライド1:
「${s}、我慢していませんか？」

スライド2:
${t}の${s}は放置すると慢性化することも…

スライド3:
${clinicName}では一人ひとりに合わせたケアをご提案

スライド4:
初回カウンセリング無料！
今すぐプロフィールのリンクからご予約を

【CTA】リンクスタンプ → 予約ページへ`;
  },

  instagram_reel: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'みなさん';
    const area = input.areaName || '大阪';
    return `【リール台本（15〜30秒）】

[オープニング 0:00-0:03]
テロップ: 「${s}が気になる${t}へ」
ナレーション: ${s}に悩んでいませんか？

[本編 0:03-0:20]
テロップ: 「原因は○○かも」
ナレーション: 実は${s}の多くは、日常の姿勢や身体のバランスの乱れが原因。${clinicName}では根本からアプローチする施術を行っています。

[エンディング 0:20-0:30]
テロップ: 「初回カウンセリング無料」
ナレーション: ${area}の${clinicName}で、まずはお身体の状態をチェックしてみませんか？

【キャプション】
${s}の原因、知っていますか？
${clinicName}では根本から向き合います。

#${s} #整体 #${area}整体 #${clinicName} #リール #健康 #ボディケア`;
  },

  // ── YouTube ───────────────────────────────────────────
  youtube_short: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'みなさん';
    return `【YouTubeショート台本（60秒以内）】

[フック 0:00-0:05]
「${t}、${s}を放置していませんか？」

[問題提起 0:05-0:15]
${s}は日常生活の姿勢や身体のバランスの乱れが原因であることが多いんです。放っておくと慢性化してしまうことも。

[解決策 0:15-0:40]
${clinicName}では、お一人おひとりの状態に合わせたケアを提案しています。
ポイントは3つ:
1. 丁寧なカウンセリングで原因を特定
2. 根本からアプローチする施術
3. 日常でできるセルフケアのアドバイス

[CTA 0:40-0:60]
初回カウンセリングは無料です。概要欄のリンクからご予約ください。
チャンネル登録もお願いします！

【タイトル】${s}を放置すると…？プロが教える改善のコツ
【説明文】${clinicName}が${s}の原因と対策を60秒で解説。`;
  },

  youtube_script: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || '患者様';
    const area = input.areaName || '大阪';
    const scale = CHAR_SCALE[input.charCount];
    const duration = scale >= 1.5 ? '8〜10分' : scale >= 1.0 ? '5〜7分' : '3〜5分';
    return `【YouTube動画台本（${duration}）】

■ タイトル案
「【${s}改善】${input.theme}を専門家が徹底解説｜${clinicName}」

■ サムネイルテキスト案
「${s}の本当の原因」「知らないと損」

■ オープニング（〜30秒）
こんにちは、${area}の${clinicName}です。
今日は「${input.theme}」というテーマでお話しします。
${t}の方で${s}に悩んでいる方、ぜひ最後までご覧ください。

■ 本編セクション1: ${s}の原因
${s}の主な原因は、日常生活の姿勢の乱れや身体のバランスの崩れにあります。
デスクワークやスマートフォンの使いすぎで、知らないうちに身体に負担がかかっています。

■ 本編セクション2: よくある間違い
市販の薬やマッサージで一時的に楽になっても、根本的な解決にはなりません。
大切なのは、原因そのものにアプローチすることです。

■ 本編セクション3: ${clinicName}のアプローチ
当院では、丁寧なカウンセリングを通じて一人ひとりの原因を特定し、
お身体の状態に合わせた施術プランをご提案しています。

■ セルフケア紹介
ご自宅でできる簡単なセルフケアもご紹介します。
1. 正しい姿勢を意識する
2. 1日5分のストレッチ
3. 定期的な身体のメンテナンス

■ エンディング
${s}でお悩みの方は、ぜひ一度${clinicName}にご相談ください。
初回カウンセリングは無料です。概要欄にリンクを貼っておきますので、ぜひチェックしてください。
チャンネル登録・高評価もよろしくお願いします！

■ 概要欄テンプレート
${clinicName}｜${area}
${input.theme}について専門家が解説。
▶ ご予約・お問い合わせはこちら: [URL]
▶ 公式Instagram: [URL]
#${s} #${clinicName} #${area}整体`;
  },

  // ── Threads ───────────────────────────────────────────
  threads: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'みなさん';
    const area = input.areaName || '大阪';
    return `${s}に悩む${t}へ。

「もう慣れた」と思っていませんか？
実は${s}の多くは、身体のバランスの乱れが原因。

${clinicName}（${area}）では、根本からアプローチする施術を行っています。

初回カウンセリング無料。
プロフィールのリンクからご予約ください。

#${s} #整体 #${area} #${clinicName} #根本改善`;
  },

  // ── Meta広告 ──────────────────────────────────────────
  meta_ad: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'あなた';
    const area = input.areaName || '大阪';
    return `【案1 - 問題提起型】
ヘッドライン: 「その${s}、放置してませんか？」
本文: ${t}の${s}は、放っておくと慢性化してしまいます。${clinicName}では根本原因にアプローチ。初回カウンセリング無料！
CTA: 無料カウンセリングを予約する

【案2 - ベネフィット訴求型】
ヘッドライン: 「${s}から解放されたい方へ」
本文: ${clinicName}の独自アプローチで、多くの方が${s}の改善を実感。あなたも一歩踏み出してみませんか？
CTA: 詳しくはこちら

【案3 - 地域限定型】
ヘッドライン: 「${area}で${input.theme}なら${clinicName}」
本文: ${s}でお悩みの方、今すぐ無料相談へ。予約はWebから簡単にできます。
CTA: 今すぐ予約する`;
  },

  meta_ad_video: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'あなた';
    const area = input.areaName || '大阪';
    return `【Meta動画広告 構成案（15〜30秒）】

【案1 - ストーリー型】
[0:00-0:03] フック: 「${s}、我慢していませんか？」
[0:03-0:10] 問題: ${t}の${s}は放置すると慢性化することも
[0:10-0:20] 解決: ${clinicName}の根本アプローチで多くの方が改善を実感
[0:20-0:25] CTA: 初回カウンセリング無料
[0:25-0:30] ロゴ・予約導線
テキストオーバーレイ: 「${area}の${clinicName}｜初回無料」

【案2 - ビフォーアフター型】
[0:00-0:03] フック: 「${s}の原因、知っていますか？」
[0:03-0:12] 施術前: ${s}で悩む日常のイメージ
[0:12-0:22] 施術後: ${clinicName}のケアで身体が軽くなるイメージ
[0:22-0:30] CTA: まずは無料カウンセリングから
テキストオーバーレイ: 「根本から変わる体験を｜${clinicName}」

【案3 - 証言型】
[0:00-0:05] フック: 「通ってよかった」の声
[0:05-0:20] ${t}の感想イメージ（※実際の声に差し替え）
[0:20-0:30] CTA: ${area}の${clinicName}で体験してみませんか？
テキストオーバーレイ: 「${clinicName}｜予約はWebから」`;
  },

  // ── LINE ──────────────────────────────────────────────
  line_message: (ctx) => {
    const { clinicName, input } = ctx;
    const s = input.symptom || input.theme;
    const t = input.target || 'お客様';
    return `【LINE配信メッセージ】

${clinicName}より

${t}へ
${s}についてのお知らせです。

${s}でお悩みではありませんか？
当院では${input.theme}に特化したケアを行っています。

＼ 今だけ ／
初回カウンセリング無料実施中！

お気軽にこのLINEからご予約・ご相談ください。

━━━━━━━━━━━━
${clinicName}
ご予約はこちら▼
[予約リンク]
━━━━━━━━━━━━`;
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
    instagram:       `Instagram投稿キャプションを生成してください。共感を呼ぶ導入、施術の特徴、CTA、関連ハッシュタグ（10〜15個）を含めること。${charGuide}`,
    instagram_story: `Instagramストーリーズ用のテキスト構成を生成してください。スライド3〜5枚分のテキストと最後にCTA（リンクスタンプ誘導）を含めること。`,
    instagram_reel:  `Instagramリール用の台本（15〜30秒）を生成してください。フック→本編→CTAの構成で、テロップテキストとナレーションを含めること。キャプションとハッシュタグも付けること。`,
    youtube_short:   `YouTubeショート動画の台本（60秒以内）を生成してください。冒頭のフック→問題提起→解決策→CTAの構成で。タイトルと説明文も含めること。`,
    youtube_script:  `YouTube動画の台本を生成してください。タイトル案、サムネイルテキスト案、オープニング、本編（セクション分け）、セルフケア紹介、エンディング、概要欄テンプレートを含めること。${charGuide}`,
    threads:         `Threads投稿文を生成してください。簡潔で共感を呼ぶ文体で、500文字以内。ハッシュタグ（5〜8個）を含めること。`,
    meta_ad:         `Meta広告（Facebook/Instagram広告）のテキストコピーを3案（案1〜3）生成してください。各案にヘッドライン・本文・CTAボタンテキストを含めること。`,
    meta_ad_video:   `Meta動画広告の構成台本を3案生成してください。各案に15〜30秒の秒数割り振り、テロップテキスト、ナレーション、CTAを含めること。`,
    line_message:    `LINE公式アカウントの配信メッセージを生成してください。親しみやすいトーンで、告知内容・特典・予約誘導を含めた構成にすること。${charGuide}`,
  };

  // 高評価コンテンツ例（Few-shot）
  const examples = ctx.goodExamples?.[mediaType] ?? [];
  const exampleSection = examples.length > 0
    ? `\n【参考例：過去の高評価コンテンツ（${examples.length}件）】\n` +
      examples.map((ex, i) => `--- 例${i + 1} ---\n${ex}`).join('\n') +
      '\n上記を参考に、同等以上のクオリティで生成してください。'
    : '';

  return `あなたは日本の治療院SNSマーケティングの専門家です。以下の条件でSNSコンテンツを生成してください。

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
