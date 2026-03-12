import { generateText, IS_MOCK_MODE } from './client';

const LINE_TYPE_LABELS = {
  follow_up:    '施術後フォロー',
  reminder:     '来院リマインド',
  reactivation: '再来院促進',
};

// ─── モックデータ ─────────────────────────────────────────
const MOCK_MESSAGES: Record<string, string> = {
  follow_up: `こんにちは、○○さん！先日はご来院いただきありがとうございました😊

今日の施術はいかがでしたか？
「腰のだるさがあって、立っているとつらい」とおっしゃっていたのでとても気になっています。

施術後に体の変化を感じていただけていれば嬉しいのですが、何かご不安な点やお気づきのことがありましたら、いつでもご連絡ください！

次回は症状の変化を踏まえてセルフケアのアドバイスもお伝えしますね🌿
またのご来院をお待ちしております！`,

  reminder: `○○さん、こんにちは！
前回のご来院からしばらく経ちましたがいかがお過ごしでしょうか？

「腰のだるさ」のお悩み、その後はどうでしょう？
継続的にケアしていくと改善のスピードが上がりやすいので、
タイミングが合いましたらぜひまたご来院ください✨

ご予約はこちらからどうぞ👇
（プロフィールリンクへ）`,

  reactivation: `○○さん、お久しぶりです！

以前は「腰のだるさ・立っているとつらい」というお悩みでご来院いただいていましたね。
その後いかがお過ごしでしょうか？😊

季節の変わり目は体がつらくなりやすい時期です。
少しでも気になることがあれば、またお気軽にご相談ください。

久しぶりのご来院でも安心してお越しいただけるよう、初回同様にカウンセリングからしっかり対応します🙇

気になる方はプロフィールのリンクからご予約できます。
またのご縁をお待ちしております！`,
};

// ─── プロンプト構築 ────────────────────────────────────────
function buildPrompt(
  patientName: string,
  symptom: string,
  sessionNote: string,
  visitCount: number,
  lineType: 'follow_up' | 'reminder' | 'reactivation',
  tone: string,
  brandContext: string,
  clinicName: string,
): string {
  const toneMap: Record<string, string> = {
    friendly: 'やわらかく親しみやすいトーン',
    formal:   '丁寧でフォーマルなトーン',
    casual:   'カジュアルで話しかけるようなトーン',
  };
  const lineTypeLabel = LINE_TYPE_LABELS[lineType];

  const typeInstruction: Record<string, string> = {
    follow_up:    '施術後のフォローアップメッセージ（施術翌日〜2日後に送るイメージ）。温かみがあり、症状の変化を気にかけるような内容。150〜220字程度。',
    reminder:     '来院リマインドメッセージ（前回から1〜2週間経過した方へ）。来院を促しつつ、押しつけがましくならないように。150〜200字程度。',
    reactivation: '休眠顧客への再来院促進メッセージ（1〜3ヶ月来院がない方へ）。久しぶり感を出しつつ、また足を運んでもらいやすいメッセージ。200〜250字程度。',
  };

  return `あなたは整体院・鍼灸院の患者コミュニケーションの専門家です。
以下の患者情報・施術メモをもとに、個別の LINE メッセージを作成してください。

=== 患者情報 ===
院名: ${clinicName}
患者名: ${patientName}さん
主訴・症状: ${symptom}
来院回数: ${visitCount}回
施術メモ（最新）: ${sessionNote}

=== ブランド情報 ===
${brandContext}

=== メッセージ種別 ===
${lineTypeLabel}: ${typeInstruction[lineType]}

=== 作成条件 ===
- 文体: ${toneMap[tone] ?? toneMap.friendly}
- 患者名（${patientName}さん）を自然に使うこと
- 患者の実際の症状・施術内容を文中に自然に盛り込むこと（個別感を出す）
- 絵文字を自然に1〜3個使うこと
- 医療広告ガイドラインに違反しないこと
- メッセージ本文のみ出力すること（前置きや説明文は不要）`;
}

// ─── 生成 ─────────────────────────────────────────────────
export async function generatePersonalLine(
  patientName: string,
  symptom: string,
  sessionNote: string,
  visitCount: number,
  lineType: 'follow_up' | 'reminder' | 'reactivation',
  tone: 'friendly' | 'formal' | 'casual',
  brandContext: string,
  clinicName: string,
): Promise<string> {
  if (IS_MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800));
    return MOCK_MESSAGES[lineType].replace(/○○/g, patientName);
  }

  const prompt = buildPrompt(patientName, symptom, sessionNote, visitCount, lineType, tone, brandContext, clinicName);
  const result = await generateText({ prompt });
  return result.text;
}
