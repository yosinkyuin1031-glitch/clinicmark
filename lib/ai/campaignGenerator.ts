import { IS_MOCK_MODE } from '@/lib/ai/client';
import type { AppealAxis, AdType, CampaignInput, CampaignOutput } from '@/types';
import { APPEAL_LABELS } from '@/types';

// ─── CTA テキスト（強度別 × 3案） ────────────────────────
const CTA_OPTIONS: Record<1 | 2 | 3, string[]> = {
  1: [
    'まずはお気軽にご相談ください',
    '気になる方はプロフからチェック',
    '詳しくはリンクへ',
  ],
  2: [
    '無料カウンセリングはこちら',
    '今すぐ予約する',
    'お問い合わせはこちら',
  ],
  3: [
    '今すぐ予約！限定枠残りわずか',
    '先着5名様限定！今すぐ申し込む',
    '無料体験を今すぐ予約する',
  ],
};

// ─── 訴求軸別モックコンテンツ ────────────────────────────
interface CopySet {
  headline:     string;
  mainText:     string;
  description:  string;
  videoOutline: string;
  lpHero:       string;
  lpSubcopy:    string;
}

type AxisCopyFn = (symptom: string, target: string, clinicName: string) => CopySet;

const AXIS_TEMPLATES: Record<AppealAxis, AxisCopyFn> = {
  pain: (symptom, target, clinicName) => ({
    headline:    `その${symptom}、我慢しなくていい`,
    mainText:    `毎日の${symptom}でお悩みの${target}へ。${clinicName}では、神経・筋肉・骨格の根本原因にアプローチして、${symptom}の悩みを抱えない日常をサポートします。`,
    description: `${symptom}が続いていませんか？${clinicName}の根本改善アプローチで多くの方が変化を実感しています。`,
    videoOutline:[
      '【0-3秒】フック：「${symptom}で毎日辛い方へ」テキストオーバーレイ',
      '【3-8秒】問題提起：痛みで日常生活に支障が出ているシーン',
      '【8-15秒】院内紹介：清潔感のある施術スペース',
      '【15-20秒】実績：施術前後のビフォーアフター（テキスト）',
      '【20-25秒】CTA：予約ボタン表示',
    ].join('\n').replace('${symptom}', symptom),
    lpHero:      `${symptom}に悩む${target}へ\n${clinicName}が根本から変えます`,
    lpSubcopy:   `神経・筋肉・骨格の三つの視点で、${symptom}の本当の原因を見つけます。多くの方が「楽になった」と実感しています。`,
  }),

  numbness: (symptom, target, clinicName) => ({
    headline:    `${symptom}のしびれ、放置は危険です`,
    mainText:    `${symptom}に関連するしびれや張りでお悩みの${target}へ。しびれは神経系のサインかもしれません。${clinicName}では専門的なアプローチで、しびれの根本原因を確認します。`,
    description: `しびれを感じたら早めに対処を。${clinicName}の専門スタッフが丁寧にカウンセリングします。`,
    videoOutline:[
      '【0-3秒】フック：「手足のしびれ、気になっていませんか？」',
      '【3-8秒】問題提起：しびれが日常生活に影響するシーン描写',
      '【8-15秒】解説：しびれと神経の関係（図解テキスト）',
      '【15-20秒】院内紹介・施術スタッフ紹介',
      '【20-25秒】CTA：無料相談ボタン',
    ].join('\n'),
    lpHero:      `${symptom}のしびれ、そのまま放置していませんか？\n${clinicName}が丁寧に診ます`,
    lpSubcopy:   `しびれは神経系からのサインです。早期の相談が大切です。${clinicName}では一人ひとりの状態を丁寧に確認します。`,
  }),

  anxiety: (symptom, target, clinicName) => ({
    headline:    `この${symptom}、いつまで続くの？不安なあなたへ`,
    mainText:    `「${symptom}がずっと続いている」「治るか不安」そんな${target}の気持ちに寄り添います。${clinicName}では、丁寧なカウンセリングから始め、あなたの不安を一緒に解消していきます。`,
    description: `不安を抱えたまま我慢しないで。${clinicName}がしっかりサポートします。`,
    videoOutline:[
      '【0-3秒】フック：「${symptom}が続いて不安なあなたへ」',
      '【3-8秒】不安に寄り添うメッセージ（温かみのあるトーン）',
      '【8-15秒】カウンセリング風景（スタッフと患者の対話）',
      '【15-20秒】通院後の変化（テキストメッセージ形式）',
      '【20-25秒】CTA：「まずは無料相談から」',
    ].join('\n').replace('${symptom}', symptom),
    lpHero:      `一人で悩まないで。\n${clinicName}があなたの${symptom}を一緒に解決します`,
    lpSubcopy:   `「なぜ改善しないんだろう」そんな不安に応えます。初回カウンセリングで、あなたの悩みをしっかりお聞きします。`,
  }),

  nerve: (symptom, target, clinicName) => ({
    headline:    `${symptom}の根本は「神経」にあった`,
    mainText:    `${symptom}の原因を筋肉だけで考えていませんか？${clinicName}では神経系への働きかけを重視した施術で、多くの${target}が変化を感じています。神経が整うとお体全体のバランスが変わります。`,
    description: `神経へのアプローチで根本から変わる。${clinicName}の施術を体験してみてください。`,
    videoOutline:[
      '【0-3秒】フック：「${symptom}の本当の原因、知っていますか？」',
      '【3-8秒】神経と症状の関係を図解で説明',
      '【8-15秒】${clinicName}の神経へのアプローチ説明',
      '【15-20秒】施術シーン・スタッフの専門性アピール',
      '【20-25秒】CTA：体験予約ボタン',
    ].join('\n').replace(/\${symptom}/g, symptom).replace('${clinicName}', clinicName),
    lpHero:      `${symptom}は神経から変わる\n${clinicName}のアプローチで根本改善`,
    lpSubcopy:   `神経・筋肉・骨格の連動に着目した施術で、お体の本来の動きを取り戻します。`,
  }),

  last_resort: (symptom, target, clinicName) => ({
    headline:    `どこへ行っても改善しなかった${symptom}でお悩みの方へ`,
    mainText:    `「いろいろな院に行ったが変わらない」「もう諦めかけている」そんな${target}に選ばれているのが${clinicName}です。根本原因に向き合う施術で、諦めなかった方が変化を実感しています。`,
    description: `最後の選択肢として${clinicName}を選んで変化を感じた方が多くいます。`,
    videoOutline:[
      '【0-3秒】フック：「どこへ行っても改善しなかった方へ」強いメッセージ',
      '【3-8秒】他院で改善しなかった経験への共感メッセージ',
      '【8-15秒】${clinicName}が違う理由（根本アプローチの説明）',
      '【15-20秒】実際に変化した方のコメント（テキスト形式）',
      '【20-25秒】CTA：「最後の一歩を踏み出す」ボタン',
    ].join('\n').replace('${clinicName}', clinicName),
    lpHero:      `他院で改善しなかった${symptom}に\n${clinicName}が最後の選択肢として応えます`,
    lpSubcopy:   `「もう諦めた」と感じていた方が変化を実感しています。一緒に根本から向き合いましょう。`,
  }),
};

// ─── メイン生成関数 ──────────────────────────────────────
export async function generateCampaign(
  input:        CampaignInput,
  brandContext: string,
  clinicName:   string,
): Promise<CampaignOutput[]> {
  // ── 本番LLM ──────────────────────────────────────────
  if (!IS_MOCK_MODE) {
    try {
      const { generateText } = await import('@/lib/ai/client');

      const includeVideo = input.adTypes.includes('video_ad');
      const includeLp    = input.adTypes.includes('lp');
      const axesLabels   = input.appealAxes
        .map((a) => `${a}（${APPEAL_LABELS[a]}）`)
        .join('、');
      const writingStyleMap: Record<string, string> = {
        friendly: '親しみやすい・やわらかい口調',
        formal:   '丁寧・フォーマルな口調',
        casual:   'カジュアル・フレンドリーな口調',
      };

      const prompt = `あなたは日本の治療院・整骨院専門のマーケティングコピーライターです。以下の条件で訴求軸別の広告コピーを生成してください。

【院名】${clinicName}
【症状】${input.symptom}
【ターゲット】${input.target}
【訴求軸】${axesLabels}
【広告タイプ】${input.adTypes.join('、')}
【文体】${writingStyleMap[input.writingStyle] ?? input.writingStyle}
【CTA強度】${input.ctaStrength}（1:柔らか〜3:強め）
【ブランド情報】${brandContext}

訴求軸ごとに以下のJSON配列形式で回答してください（コードブロック・前置き説明不要）:
[
  {
    "appealAxis": "pain | numbness | anxiety | nerve | last_resort のいずれか",
    "appealLabel": "訴求軸ラベル（例: 痛み訴求）",
    "headline": "広告ヘッドライン（20字以内）",
    "mainText": "広告本文（100〜150字）",
    "description": "補足説明文（50〜80字）",
    ${includeVideo ? '"videoOutline": "動画広告の構成台本（5シーン分、各シーンの秒数と指示）",' : ''}
    ${includeLp ? '"lpHero": "LPファーストビューのキャッチコピー+サブコピー", "lpSubcopy": "LP補足コピー（60字以内）",' : ''}
    "ctaOptions": ["CTA案1", "CTA案2", "CTA案3"]
  }
]
${input.appealAxes.length}訴求軸分を同じJSON配列に含めてください。医療広告ガイドラインを必ず遵守してください。`;

      const result = await generateText({ prompt, maxTokens: 3000 });
      const parsed = JSON.parse(result.text.trim()) as CampaignOutput[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // フォールバックへ
    }
  }

  // ── モック or フォールバック ──────────────────────────
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 300));
  }

  const outputs: CampaignOutput[] = input.appealAxes.map((axis) => {
    const fn   = AXIS_TEMPLATES[axis];
    const copy = fn(input.symptom, input.target, clinicName);

    const includeVideo = input.adTypes.includes('video_ad');
    const includeLp    = input.adTypes.includes('lp');

    return {
      appealAxis:    axis,
      appealLabel:   APPEAL_LABELS[axis],
      mainText:      copy.mainText,
      headline:      copy.headline,
      description:   copy.description,
      ...(includeVideo ? { videoOutline: copy.videoOutline } : {}),
      ...(includeLp    ? { lpHero: copy.lpHero, lpSubcopy: copy.lpSubcopy } : {}),
      ctaOptions:    CTA_OPTIONS[input.ctaStrength],
    } satisfies CampaignOutput;
  });

  return outputs;
}
