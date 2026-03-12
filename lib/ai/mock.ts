/**
 * モックレスポンス
 * ANTHROPIC_API_KEY が未設定の場合に使用するダミーデータ。
 * テンプレートIDと入力変数から、それらしい日本語テキストを返す。
 */

import type { GenerateTextResult } from './client';

// ─── FAQ・症状ページ ───────────────────────────────────────
function mockFaq(inputs: Record<string, string>): string {
  const symptom    = inputs.symptom ?? '症状';
  const rawTarget  = inputs.targetPatient ?? '';
  // 入力値が「〜の方」で終わっている場合は重複を避ける
  const targetSuffix = rawTarget
    ? rawTarget.endsWith('の方') ? rawTarget : `${rawTarget}の方`
    : '';
  const target = targetSuffix ? `（特に${targetSuffix}）` : '';

  return `# ${symptom} についてよくある質問${target}

## Q1. ${symptom}はなぜ起こるのですか？

${symptom}は、日常生活の姿勢のクセや筋肉の緊張・疲労の蓄積によって引き起こされることが多いです。長時間のデスクワークやスマートフォンの使用、運動不足なども大きな要因のひとつです。

## Q2. どんな人がよく来院されますか？

「${symptom}が慢性化している」「マッサージに通っているがすぐ戻る」「根本から改善したい」という方が多くいらっしゃいます。${targetSuffix ? `特に${targetSuffix}にご利用いただいています。` : ''}

## Q3. 何回くらい通えば改善しますか？

個人差はありますが、多くの方が3〜6回の施術でお体の変化を実感されています。初回施術で丁寧にお体の状態を確認し、あなたに合ったペースをご提案します。

## Q4. 施術は痛くないですか？

強い痛みを伴う施術は行っていません。お体の状態に合わせたアプローチで、リラックスしながら受けていただけます。「痛いのが苦手」という方も安心してご相談ください。

## Q5. 他の医療機関に通いながら受けられますか？

はい、問題ございません。現在通院中の治療と並行して施術を受けていただけます。ご不安な点はお気軽にご相談ください。

---
※ 掲載情報は一般的な内容であり、個別の医療アドバイスではありません。症状が重い場合は医療機関をご受診ください。`;
}

// ─── Instagram フィード投稿 ────────────────────────────────
function mockInstagramPost(inputs: Record<string, string>): string {
  const theme   = inputs.theme   ?? 'テーマ';
  const purpose = inputs.purpose ?? '認知拡大';
  const target  = inputs.target  ?? '';

  return `【Instagram フィード投稿台本】
テーマ: ${theme}　目的: ${purpose}${target ? `　ターゲット: ${target}` : ''}

─── キャプション ───

「${theme}、なんとかしたいけど何をすれば…」

そのお悩み、実は多くの方が抱えています😊

${theme}の主な原因として

✅ 日常の姿勢のクセ
✅ 長時間の同じ体勢
✅ 筋肉のこわばりと血行不良

これらが重なることで、つらい状態が続きやすくなります。

当院では一人ひとりのお体の状態をしっかり確認した上で、
根本から整えるサポートをしています。

「まずは話を聞いてみたい」という方も大歓迎です。
プロフィールのリンクからお気軽にご相談ください🙏

#${theme.replace(/\s/g, '')} #整体 #鍼灸 #健康 #体の悩み #姿勢改善

─── ビジュアル提案 ───
・1枚目: キャッチコピーを大きめのテキストで（白 or 院カラー背景）
・2枚目: 原因を箇条書きしたインフォグラフィック
・3枚目: 当院の特徴・アプローチ方法
・最終枚: CTA（「まずはご相談を」+ 連絡先）`;
}

// ─── Instagram ストーリーズ ────────────────────────────────
function mockInstagramStory(inputs: Record<string, string>): string {
  const theme      = inputs.theme      ?? 'テーマ';
  const slideCount = parseInt(inputs.slideCount ?? '5', 10);

  const slides = Array.from({ length: slideCount }, (_, i) => {
    if (i === 0) return `【スライド${i + 1}】タイトル
テキスト: 「${theme}でお悩みの方へ」
デザイン: 院カラー背景、大きなキャッチコピー、タップ促進矢印`;
    if (i === slideCount - 1) return `【スライド${i + 1}】CTA
テキスト: 「まずはお気軽にご相談ください」
デザイン: 白背景、連絡先・プロフィールリンク誘導、スワイプアップボタン`;
    return `【スライド${i + 1}】ポイント${i}
テキスト: ${theme}に関するポイント${i}を1行で簡潔に
サブテキスト: 補足説明（2〜3行）
デザイン: シンプルなカード型、アイコン1つ`;
  });

  return `【Instagram ストーリーズ台本】
テーマ: ${theme}　スライド数: ${slideCount}枚

─── 各スライド ───

${slides.join('\n\n')}

─── 共通デザイン指示 ───
・フォント: 読みやすいゴシック系
・余白: たっぷり取る（ごちゃごちゃさせない）
・アニメーション: フェードインを基本に
・ブランドカラーを統一して使用`;
}

// ─── Meta広告 ─────────────────────────────────────────────
function mockMetaAd(inputs: Record<string, string>): string {
  const theme   = inputs.theme      ?? 'テーマ';
  const target  = inputs.target     ?? '30〜50代の方';
  const adType  = inputs.adType     ?? 'リード獲得';
  const service = inputs.service    ?? '当院の施術';

  return `【Meta広告コピー案】
テーマ: ${theme}　タイプ: ${adType}

━━━━━━━━━━━━━━━━━━━━━━━━
【案1: 共感型】
━━━━━━━━━━━━━━━━━━━━━━━━
▼ ヘッドライン（30文字以内）
「${theme}、もう我慢しなくていい」

▼ プライマリテキスト（125文字以内）
毎日のつらさを「仕方ない」とあきらめていませんか？
${service}は、${target}を中心に多くのお客様に選ばれています。
まずは無料相談から、気軽にお問い合わせください。

▼ 説明文（30文字以内）
初回相談無料・予約はLINEで簡単

━━━━━━━━━━━━━━━━━━━━━━━━
【案2: 実績・信頼型】
━━━━━━━━━━━━━━━━━━━━━━━━
▼ ヘッドライン
「${theme}でお悩みなら、一度ご相談を」

▼ プライマリテキスト
「病院に行くほどでも…」と感じていませんか？
${service}では、${target}のお悩みに寄り添い丁寧に対応しています。
お気軽にご相談ください。

▼ 説明文
土日祝も対応・駅から徒歩5分

━━━━━━━━━━━━━━━━━━━━━━━━
【案3: 緊急訴求型】
━━━━━━━━━━━━━━━━━━━━━━━━
▼ ヘッドライン
「今月限定キャンペーン実施中」

▼ プライマリテキスト
${theme}でお困りの方へ。
今なら初回施術が特別価格でお試しいただけます。
お早めにご予約ください。

▼ 説明文
残り枠わずか・今すぐ予約

━━━━━━━━━━━━━━━━━━━━━━━━
【ターゲティング提案】
・年齢: 28〜55歳
・興味関心: 健康・ウェルネス、整体・鍼灸、${theme}
・地域: 院の所在地 + 半径5km
・除外: 既存顧客リスト`;
}

// ─── LPセクション ────────────────────────────────────────
function mockLpSection(inputs: Record<string, string>): string {
  const sectionType = inputs.sectionType ?? 'ヒーロー';
  const targetPage  = inputs.targetPage  ?? 'LP';
  const target      = inputs.target      ?? '悩みを抱えた方';
  const strength    = inputs.strength    ?? '丁寧な施術';

  const sectionMap: Record<string, string> = {
    'ヒーロー': `【ヒーローセクション】
─── キャッチコピー（メイン） ───
「${target}へ。あなたの不調に、向き合います。」

─── サブコピー ───
「${targetPage}」では、${strength}でお一人おひとりの状態に合わせた施術をご提供しています。
「いつまで続くんだろう…」という不安を、一緒に解消しましょう。

─── CTAボタン ───
【無料相談はこちら】　または　【今すぐ予約する】

─── ビジュアル案 ───
・院内の明るく清潔感ある写真（施術台 or 受付）
・スタッフの笑顔（顔出しNGの場合は後ろ姿）
・背景: 白 or 院カラーのグラデーション`,

    '症状リスト': `【症状リストセクション】
─── 見出し ───
「こんなお悩みはありませんか？」

─── 症状チェックリスト ───
☑ ${targetPage.replace('LP', '')}がずっと続いている
☑ 市販薬や湿布を使っても一時的にしか楽にならない
☑ 病院に行っても「異常なし」と言われた
☑ マッサージに通っているがすぐ戻ってしまう
☑ 仕事や家事に支障が出てきている
☑ 「年だから仕方ない」とあきらめかけている

─── 締めコピー ───
ひとつでも当てはまる方は、ぜひ一度ご相談ください。
${strength}で、根本からアプローチします。`,

    '強み': `【強みセクション】
─── 見出し ───
「当院が選ばれる3つの理由」

─── 強み1 ───
▼ 一人ひとりに向き合う丁寧なカウンセリング
初回は30分かけてお体の状態・生活習慣・お悩みを丁寧にヒアリング。
症状の表面だけでなく、原因を探るところから始めます。

─── 強み2 ───
▼ ${strength}
${target}のお悩みに特化した独自のアプローチで、多くの方に変化を実感していただいています。

─── 強み3 ───
▼ 通いやすい環境づくり
完全予約制・個室対応で、プライバシーに配慮した環境を整えています。
ご予約はLINEでカンタンに。`,

    'CTA': `【CTAセクション】
─── 見出し ───
「まずはお気軽にご相談ください」

─── コピー ───
${target}のお悩みを、一人で抱え込まないでください。
当院では初回のご相談・ご予約を随時受け付けています。

─── CTAボタン ───
【LINE で予約する（24時間受付）】
【お電話でのご相談はこちら】

─── 安心要素 ───
・初回相談無料
・強引な勧誘は一切ありません
・完全予約制でプライバシー配慮
・土日祝も対応可`,
  };

  const sectionContent = sectionMap[sectionType] ?? sectionMap['ヒーロー'];

  return `【LPセクション原稿】
対象ページ: ${targetPage}　セクション: ${sectionType}

${sectionContent}

━━━━━━━━━━━━━━━━━━━━━━━━
【コーディング・デザイン補足】
・PC: 2カラム or 中央揃えフルワイド
・SP: 縦1カラム、フォントサイズ16px以上
・CTA ボタン: 院カラー背景、白文字、角丸
・画像: alt テキストにキーワードを含める（SEO対策）`;
}

// ─── メインのモック関数 ──────────────────────────────────
export function getMockResponse(
  templateId: string,
  inputs: Record<string, string>,
): GenerateTextResult {
  // 実際のAPIコールを模した遅延（500ms〜1200ms）はawait側で対応
  let text: string;

  if (templateId.includes('instagram-story')) {
    text = mockInstagramStory(inputs);
  } else if (templateId.includes('instagram')) {
    text = mockInstagramPost(inputs);
  } else if (templateId.includes('meta-ad')) {
    text = mockMetaAd(inputs);
  } else if (templateId.includes('lp')) {
    text = mockLpSection(inputs);
  } else {
    // FAQ or fallback
    text = mockFaq(inputs);
  }

  return {
    text,
    inputTokens:  320,  // ダミートークン数
    outputTokens: 480,
    durationMs:   800,  // ダミー処理時間
  };
}
