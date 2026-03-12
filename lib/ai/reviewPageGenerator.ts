import { generateText, IS_MOCK_MODE } from './client';

// ─── モック案内文 ─────────────────────────────────────────
const MOCK_GUIDANCE_POSITIVE = `本日はご来院いただきありがとうございました！

施術はいかがでしたか？

もしご満足いただけましたら、Googleマップへの口コミをお願いできますか？
お声が、同じお悩みを抱える方の参考になります😊

以下のボタンから簡単に投稿できます👇`;

const MOCK_GUIDANCE_HOTPEPPER = `ホットペッパービューティーをご利用の方は、
こちらからもぜひ口コミをお寄せください🙇`;

const MOCK_GUIDANCE_NEGATIVE = `本日はご来院いただきありがとうございました。

施術・サービスで気になった点はございましたか？

お気づきの点がありましたら、私どもに直接お聞かせいただけると幸いです。
より良い施術・サービスの改善に活かしてまいります。

お気軽にスタッフまでお声がけください😊`;

// ─── プロンプト構築 ────────────────────────────────────────
function buildPrompt(clinicName: string, hasHotpepper: boolean, brandContext: string): string {
  return `あなたは患者体験・口コミ戦略のプロフェッショナルです。
以下の院の口コミ収集ページで使う案内文を作成してください。

=== 院情報 ===
院名: ${clinicName}
${brandContext}

=== 出力形式（JSON）===
{
  "guidance_positive": "満足した患者さん向けの案内文（Googleマップへ誘導）150字以内。温かみのある文体で。",
  "guidance_hotpepper": "${hasHotpepper ? 'ホットペッパーへの誘導文（100字以内）' : '（不要なので空文字列でOK）'}",
  "guidance_negative": "不満がある患者さん向けのフォロー文（院への直接フィードバックを促す）150字以内。謙虚で誠実な文体で。",
  "page_title": "口コミ収集ページのタイトル（例: ○○院へのご感想）",
  "satisfaction_question": "満足度を聞く質問文（例: 本日の施術はいかがでしたか？）"
}

JSONのみ出力してください（前置きや説明文は不要）。`;
}

// ─── パース ───────────────────────────────────────────────
interface GuidanceTexts {
  guidancePositive: string;
  guidanceHotpepper: string;
  guidanceNegative: string;
  pageTitle: string;
  satisfactionQuestion: string;
}

function parseTexts(text: string, clinicName: string): GuidanceTexts {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('JSONが見つかりません');
  const parsed = JSON.parse(match[0]);
  return {
    guidancePositive:     String(parsed.guidance_positive      ?? MOCK_GUIDANCE_POSITIVE),
    guidanceHotpepper:    String(parsed.guidance_hotpepper     ?? ''),
    guidanceNegative:     String(parsed.guidance_negative      ?? MOCK_GUIDANCE_NEGATIVE),
    pageTitle:            String(parsed.page_title             ?? `${clinicName}へのご感想`),
    satisfactionQuestion: String(parsed.satisfaction_question  ?? '本日の施術はいかがでしたか？'),
  };
}

// ─── 生成 ─────────────────────────────────────────────────
export async function generateReviewGuidance(
  clinicName: string,
  hasHotpepper: boolean,
  brandContext: string,
): Promise<GuidanceTexts> {
  if (IS_MOCK_MODE) {
    await new Promise(r => setTimeout(r, 600));
    return {
      guidancePositive:     MOCK_GUIDANCE_POSITIVE,
      guidanceHotpepper:    hasHotpepper ? MOCK_GUIDANCE_HOTPEPPER : '',
      guidanceNegative:     MOCK_GUIDANCE_NEGATIVE,
      pageTitle:            `${clinicName}へのご感想`,
      satisfactionQuestion: '本日の施術はいかがでしたか？',
    };
  }

  const prompt = buildPrompt(clinicName, hasHotpepper, brandContext);
  const result = await generateText({ prompt });
  return parseTexts(result.text, clinicName);
}
