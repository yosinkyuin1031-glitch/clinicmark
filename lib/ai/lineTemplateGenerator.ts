import { IS_MOCK_MODE } from '@/lib/ai/client';
import type { LineTemplateGenInput, LineCategory } from '@/types';
import { LINE_CATEGORY_LABELS } from '@/types';
import { buildBrandContext } from '@/lib/ai/buildPrompt';

// ─── モックデータ ──────────────────────────────────────
const MOCK_MESSAGES: Record<LineCategory, (ctx: string, tone: string) => string> = {
  greeting:     (ctx) => `${ctx}、はじめまして！\n\nこの度はご登録いただきありがとうございます😊\n\n当院では一人ひとりのお身体の状態に合わせたケアを大切にしています。\n\nご不明な点やご要望がございましたら、お気軽にメッセージをお送りください。\n\n今後ともどうぞよろしくお願いいたします🙏`,
  reminder:     (ctx) => `${ctx}、明日のご予約のご確認です📋\n\n明日 ○時○分 に大口神経整体院でのご予約が入っております。\n\n🏥 場所: ○○\n🕐 時間: ○時○分\n📞 変更: ○○-○○○○\n\nお気をつけてお越しください。お待ちしております！`,
  follow_up:    ()    => `本日はご来院いただきありがとうございました🙏\n\nお身体の調子はいかがでしょうか？\n\n施術後は一時的にだるさを感じることがありますが、お水をしっかり飲んでゆっくりお休みください。\n\n何かご不明な点がございましたらご連絡ください😊\n\n次回のご予約もお待ちしております！`,
  reactivation: ()    => `こんにちは！大口神経整体院です🌟\n\nしばらくご来院いただいておりませんが、お身体の調子はいかがですか？\n\nこの度、久しぶりにご来院いただける方への特別プランをご用意しました✨\n\n詳細は以下をご確認ください。\nぜひこの機会にまたお越しください😊`,
  promotion:    (ctx) => `${ctx}、お知らせです🎉\n\n現在キャンペーンを実施中です！\n\n✨ ○月○日まで\n💰 初回体験コース特別価格\n\n詳しくはこちらのリンクをご覧ください👇\n[リンクを設定してください]\n\nご予約はLINEまたはお電話にて承っております📞`,
  custom:       (ctx) => `${ctx}\n\n当院からのお知らせです。\n\nいつもご利用いただきありがとうございます。\n\n[メッセージ内容をここに入力してください]\n\nご不明な点がありましたらお気軽にご連絡ください😊`,
};

function mockTemplate(input: LineTemplateGenInput): string {
  const ctx = input.context || '患者様';
  return (MOCK_MESSAGES[input.category] ?? MOCK_MESSAGES.custom)(ctx, input.tone);
}

// ─── LLM プロンプト ────────────────────────────────────
function buildLinePrompt(input: LineTemplateGenInput, brandContext: string, clinicName: string): string {
  const toneGuide =
    input.tone === 'friendly' ? 'やわらかく親しみやすい丁寧語' :
    input.tone === 'formal'   ? '丁寧でプロフェッショナルな敬語' :
                                'フレンドリーでカジュアルな口調';

  return `あなたは日本の治療院の LINE 公式アカウント担当者です。以下の条件でメッセージを作成してください。

【院情報】
院名: ${clinicName}
ブランド情報: ${brandContext}

【メッセージ条件】
カテゴリ: ${LINE_CATEGORY_LABELS[input.category]}
用途・背景: ${input.context}
文体: ${toneGuide}

【要件】
- LINE メッセージとして自然な長さ（200〜400字）
- 絵文字を適度に使用（過剰不可）
- 医療広告ガイドライン遵守
- ${clinicName}として一人称で書く
- 本文のみ出力（前後の説明不要）`;
}

// ─── 生成メイン ────────────────────────────────────────
export async function generateLineTemplate(
  input:      LineTemplateGenInput,
  clinicName: string,
): Promise<string> {
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 250 + Math.random() * 150));
    return mockTemplate(input);
  }

  const brandContext = await buildBrandContext(input.clinicId);
  const { generateText } = await import('@/lib/ai/client');
  const prompt = buildLinePrompt(input, brandContext, clinicName);

  try {
    const result = await generateText({ prompt, maxTokens: 800 });
    return result.text.trim() || mockTemplate(input);
  } catch {
    return mockTemplate(input);
  }
}
