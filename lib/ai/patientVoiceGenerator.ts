import { PatientVoiceMediaType, PatientVoiceOutputItem } from '@/types';
import { generateText, IS_MOCK_MODE } from './client';

// ─── 医療NG ワード ────────────────────────────────────────
const MEDICAL_NG_WORDS = [
  '完治', '治ります', '必ず治る', '絶対に良くなる',
  '病気を治す', '完全回復', '100%', '効果を保証',
];

function checkMedicalNgWords(text: string): string[] {
  return MEDICAL_NG_WORDS.filter(w => text.includes(w));
}

// ─── モックデータ ─────────────────────────────────────────
const MOCK_DATA: Record<PatientVoiceMediaType, string> = {
  pv_instagram: `「毎朝、首と肩がパンパンで起き上がるのがつらい…」

そんなお声をよく耳にします。

デスクワーク中の長時間の前かがみ姿勢が
首まわりの筋肉を慢性的に緊張させ、
頭痛や目の疲れにつながっていることも🤔

当院では深部の筋肉へのアプローチ＋
セルフケア指導で
「仕事中の頭痛が気にならなくなった」
と感じていただける方が増えています✨

まずは初回カウンセリングへ👇
プロフィールのリンクからご予約できます！

#肩こり #頭痛改善 #デスクワーク #姿勢改善 #整体 #鍼灸`,

  pv_instagram_story: `😣「毎朝、首と肩がパンパン…」

そんなお悩み、ありませんか？

実はその原因、
デスクワーク中の姿勢かも💡

当院で改善した方が増えています✨

▼ 詳しくはハイライトへ`,

  pv_youtube_short: `【台本】

🎬 フック（冒頭3秒）
「毎朝起きると首と肩がパンパン…そんな経験ありませんか？」

📖 本編
実はこれ、デスクワーク中の姿勢が大きく関係しています。
長時間の前かがみ姿勢が首まわりの筋肉を慢性的に緊張させ、
頭痛や目の疲れにまでつながることがあるんです。

当院では深部の筋肉へのアプローチとセルフケア指導を組み合わせて、
根本的な改善を目指しています。

🔚 CTA
「同じ悩みがある方は、概要欄のリンクからご予約ください！」`,

  pv_meta_ad: `「毎朝、首と肩がパンパンで目が覚める…」
その慢性的な疲れ、放っておいていませんか？

同じお悩みを持つ患者さんが、当院でのアプローチを通じて「仕事中の頭痛が減った」と実感しています。

▶ 初回カウンセリング無料
▶ 完全予約制・個室対応

まずはご相談ください。`,

  pv_line_message: `こんにちは！先日はご来院いただきありがとうございました😊

「毎朝、首と肩がパンパンな状態が続いている」とおっしゃっていたこと、とても気になっています。

施術後のご様子はいかがでしょうか？何かご不安なことや、気になる症状がありましたらいつでもご連絡ください。

セルフケアのコツも次回お伝えしますね。またのご来院をお待ちしております🌿`,

  pv_threads: `「毎朝、首と肩がパンパンで起き上がるのがつらい…」

こういうお声、本当に多いです。

デスクワーク中の前かがみ姿勢 → 首まわりの筋肉が慢性的に緊張 → 頭痛・目の疲れ…という悪循環。

当院では深部の筋肉へのアプローチ＋セルフケア指導で「仕事中の頭痛が気にならなくなった」と感じていただける方が増えています。

初回カウンセリング無料。気になる方はプロフィールからどうぞ。`,
};

// ─── プロンプト構築 ────────────────────────────────────────
function buildPrompt(
  type: PatientVoiceMediaType,
  voiceText: string,
  symptom: string,
  target: string,
  writingStyle: string,
  brandContext: string,
  clinicName: string,
): string {
  const styleMap: Record<string, string> = {
    friendly: 'やわらかく親しみやすいトーン',
    formal:   '丁寧でフォーマルなトーン',
    casual:   'カジュアルで話しかけるようなトーン',
  };
  const style = styleMap[writingStyle] ?? styleMap.friendly;

  const typeInstructions: Record<PatientVoiceMediaType, string> = {
    pv_instagram: `患者の声を活用した Instagram 投稿文を作成してください。
・患者さんの言葉から始まる共感できる書き出し
・症状の原因・解説（2〜3行）
・当院のアプローチのポイント
・CTA（プロフィールのリンクへ誘導）
・ハッシュタグ 10〜12個
改行を活用して読みやすくしてください。`,

    pv_instagram_story: `患者の声を活用した Instagram ストーリーズ用の短文（80〜120字）を作成してください。
・冒頭に患者さんの言葉（短縮OK）を絵文字付きで配置
・2〜3行で症状の原因を簡潔に
・「詳しくはハイライトへ」等のCTA
スマホ画面で一目で読める長さにしてください。`,

    pv_youtube_short: `患者の声を活用した YouTube ショート動画の台本（60秒以内）を作成してください。
・フック（冒頭3秒）: 患者さんの言葉を引用した問いかけ
・本編: 症状の原因説明と当院のアプローチ（簡潔に）
・CTA: 概要欄リンクへの誘導
「🎬 フック」「📖 本編」「🔚 CTA」の見出しで構成してください。`,

    pv_meta_ad: `患者の声を活用した Meta 広告文（Facebook/Instagram）を作成してください。
・キャッチコピー（25字以内）
・本文（100〜150字）
・CTA（例: 初回カウンセリング無料）
患者さんの言葉から「共感」を引き出す訴求にしてください。`,

    pv_line_message: `施術後フォローの LINE メッセージ（150〜200字）を作成してください。
患者さんが来院時に話していた内容（患者の声）を踏まえて、個別感のある温かいメッセージにしてください。
絵文字を自然に 1〜2個使用してください。`,

    pv_threads: `患者の声を活用した Threads 投稿文（150〜250字）を作成してください。
・患者さんの言葉から始まる共感できる書き出し
・症状の原因を簡潔に説明（1〜2文）
・当院のアプローチのポイント
・CTA（プロフィールリンクへ誘導）
会話調で読みやすい文体にしてください。`,
  };

  return `あなたは医療・健康系コンテンツの専門ライターです。
以下の患者さんの実際の声（発言）をもとに、集客コンテンツを作成してください。

=== 患者の声（実際の発言） ===
${voiceText}

=== 基本情報 ===
院名: ${clinicName}
症状・悩み: ${symptom || '（患者の声から判断してください）'}
ターゲット: ${target || '（患者の声から判断してください）'}
文体: ${style}

=== ブランド情報 ===
${brandContext}

=== 作成するコンテンツ ===
${typeInstructions[type]}

=== 注意事項 ===
- 「完治」「治ります」「必ず」「100%」など医療広告ガイドラインに違反する表現は使用しないでください
- 患者さんのリアルな言葉・フレーズを活かしてください
- 自然で読みやすい文章にしてください
コンテンツのみを出力してください（前置きや説明文は不要）。`;
}

// ─── 単体生成 ─────────────────────────────────────────────
async function generateOne(
  type: PatientVoiceMediaType,
  voiceText: string,
  symptom: string,
  target: string,
  writingStyle: 'friendly' | 'formal' | 'casual',
  brandContext: string,
  clinicName: string,
): Promise<PatientVoiceOutputItem> {
  let content: string;

  if (IS_MOCK_MODE) {
    await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
    content = MOCK_DATA[type];
  } else {
    const prompt = buildPrompt(type, voiceText, symptom, target, writingStyle, brandContext, clinicName);
    const result = await generateText({ prompt });
    content = result.text;
  }

  const ngWords = checkMedicalNgWords(content);

  return {
    mediaType: type,
    label:     '',   // caller が PATIENT_VOICE_MEDIA_LABELS[type] をセット
    content,
    charCount: content.length,
    warnings:  ngWords.map(w => `医療NG表現「${w}」が含まれています`),
  };
}

// ─── 一括生成（並列） ─────────────────────────────────────
export async function generateAllPatientVoice(
  voiceText: string,
  symptom: string,
  target: string,
  writingStyle: 'friendly' | 'formal' | 'casual',
  mediaTypes: PatientVoiceMediaType[],
  brandContext: string,
  clinicName: string,
): Promise<PatientVoiceOutputItem[]> {
  return Promise.all(
    mediaTypes.map(type =>
      generateOne(type, voiceText, symptom, target, writingStyle, brandContext, clinicName)
    ),
  );
}
