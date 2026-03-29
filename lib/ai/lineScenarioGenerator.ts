import { IS_MOCK_MODE } from '@/lib/ai/client';
import type { ScenarioGenInput, GeneratedStep, ScenarioType } from '@/types';
import { SCENARIO_TYPE_LABELS } from '@/types';
import { buildBrandContext } from '@/lib/ai/buildPrompt';

// ─── バリデーション ─────────────────────────────────────
function validateGeneratedSteps(steps: unknown): GeneratedStep[] {
  if (!Array.isArray(steps)) {
    throw new Error('生成結果がJSON配列ではありません');
  }
  if (steps.length === 0) {
    throw new Error('生成されたステップが0件です');
  }

  return steps.map((step, i) => {
    if (!step || typeof step !== 'object') {
      throw new Error(`ステップ${i + 1}が不正なオブジェクトです`);
    }

    const s = step as Record<string, unknown>;

    // Required fields
    if (typeof s.stepNumber !== 'number') {
      throw new Error(`ステップ${i + 1}: stepNumberが不正です`);
    }
    if (typeof s.title !== 'string' || s.title.length === 0) {
      throw new Error(`ステップ${i + 1}: titleが空です`);
    }
    if (typeof s.message !== 'string' || s.message.length === 0) {
      throw new Error(`ステップ${i + 1}: messageが空です`);
    }

    // LINE message max length
    if (s.message.length > 1000) {
      // Truncate instead of failing (AI may slightly exceed)
      s.message = (s.message as string).slice(0, 1000);
    }

    // Delay validation
    const delayDays = typeof s.delayDays === 'number' ? s.delayDays : 0;
    const delayHours = typeof s.delayHours === 'number' ? s.delayHours : 0;

    if (delayDays < 0 || delayDays > 365) {
      throw new Error(`ステップ${i + 1}: delayDaysが範囲外です（0〜365）`);
    }
    if (delayHours < 0 || delayHours > 23) {
      throw new Error(`ステップ${i + 1}: delayHoursが範囲外です（0〜23）`);
    }

    return {
      stepNumber: s.stepNumber as number,
      title:      s.title as string,
      message:    s.message as string,
      delayDays,
      delayHours,
      condition:  typeof s.condition === 'string' ? s.condition : '',
    };
  });
}

// ─── モックデータ ──────────────────────────────────────
const MOCK_STEPS: Record<ScenarioType, (theme: string, tone: string) => GeneratedStep[]> = {
  pre_visit: (theme) => [
    {
      stepNumber: 1,
      title:      '予約確認メッセージ',
      message:    `ご予約いただきありがとうございます😊\n\n${theme}のご相談でお越しいただく予定となっております。\n\nご来院当日は、お身体の状態についてしっかりお聞きします。\n\nご不明な点がございましたらお気軽にご連絡ください。\n\nどうぞよろしくお願いいたします🙏`,
      delayDays:  0,
      delayHours: 0,
      condition:  '予約完了直後に送信',
    },
    {
      stepNumber: 2,
      title:      '前日リマインド',
      message:    `明日のご予約のご確認です📋\n\n明日、ご来院のご予約が入っております。\n\n🏥 場所: 当院（〇〇駅より徒歩〇分）\n⏰ お時間になりましたらお越しください\n📞 変更・キャンセル: LINEでご連絡ください\n\nお気をつけてお越しください😊`,
      delayDays:  -1,
      delayHours: 0,
      condition:  '予約日前日の10:00に送信',
    },
    {
      stepNumber: 3,
      title:      '当日案内',
      message:    `本日はご来院日です🌟\n\nお待ちしております！\n\nご到着の際はスタッフにお声がけください。\n\n駐車場をご利用の場合は、施術後に駐車券をお渡しします。\n\nどうぞよろしくお願いいたします🙏`,
      delayDays:  0,
      delayHours: 9,
      condition:  '予約当日の9:00に送信',
    },
  ],
  post_visit: (theme) => [
    {
      stepNumber: 1,
      title:      '施術後フォロー（翌日）',
      message:    `昨日はご来院いただきありがとうございました🙏\n\n${theme}の施術後、お身体の調子はいかがでしょうか？\n\n施術後は一時的にだるさを感じることがありますが、お水をしっかり飲んでゆっくりお休みください。\n\nご不明な点がございましたらお気軽にご連絡ください😊`,
      delayDays:  1,
      delayHours: 0,
      condition:  '来院翌日の10:00に送信',
    },
    {
      stepNumber: 2,
      title:      '1週間後の経過確認',
      message:    `先日はご来院いただきありがとうございました🌿\n\n施術から1週間が経ちました。お身体の状態はいかがですか？\n\n症状が気になる場合はご無理なさらず、またお気軽にご来院ください。\n\n次回のご予約はLINEまたはお電話からお気軽に承っております📞`,
      delayDays:  7,
      delayHours: 0,
      condition:  '来院7日後の10:00に送信',
    },
    {
      stepNumber: 3,
      title:      '次回来院促進（2週間後）',
      message:    `こんにちは！大口神経整体院です😊\n\n${theme}の施術から2週間が経ちました。\n\nお身体の状態を定期的にメンテナンスすることで、症状の再発を防ぎやすくなります。\n\nご都合のよいときにぜひまたお越しください。\n\nLINEからご予約いただけます👇`,
      delayDays:  14,
      delayHours: 0,
      condition:  '来院14日後の10:00に送信',
    },
  ],
  dormant: (theme) => [
    {
      stepNumber: 1,
      title:      '久しぶりのご連絡',
      message:    `こんにちは！大口神経整体院です🌟\n\nしばらくご来院いただいておりませんが、お身体の調子はいかがですか？\n\n${theme}のお悩みはその後いかがでしょうか。\n\nまたお気軽にご相談ください😊`,
      delayDays:  30,
      delayHours: 0,
      condition:  '最終来院から30日後に送信',
    },
    {
      stepNumber: 2,
      title:      '再来院キャンペーンご案内',
      message:    `こんにちは！大口神経整体院です✨\n\nこの度、久しぶりにご来院いただける方への特別プランをご用意しました。\n\n🎁 久しぶり来院割引実施中\n📅 〇月〇日まで\n\nこの機会にぜひまたお越しください。\n\nご予約はLINEまたはお電話にて承っております📞`,
      delayDays:  60,
      delayHours: 0,
      condition:  '最終来院から60日後に送信',
    },
    {
      stepNumber: 3,
      title:      '最終フォロー',
      message:    `こんにちは！大口神経整体院です🌿\n\nお身体のご状態が気になっておりました。\n\n${theme}のお悩みはいつでもご相談ください。\n\nまたいつかお越しいただける日をスタッフ一同お待ちしております😊\n\n何かご不明な点がございましたらお気軽にどうぞ。`,
      delayDays:  90,
      delayHours: 0,
      condition:  '最終来院から90日後に送信',
    },
  ],
  custom: (theme) => [
    {
      stepNumber: 1,
      title:      'ステップ1',
      message:    `${theme}についてのご案内です😊\n\nいつもご利用いただきありがとうございます。\n\n[メッセージ内容をここに入力してください]\n\nご不明な点がございましたらお気軽にご連絡ください。`,
      delayDays:  0,
      delayHours: 0,
      condition:  'トリガー発生後すぐに送信',
    },
    {
      stepNumber: 2,
      title:      'ステップ2',
      message:    `引き続き${theme}についてのご案内です🌟\n\n[メッセージ内容をここに入力してください]\n\nどうぞよろしくお願いいたします🙏`,
      delayDays:  3,
      delayHours: 0,
      condition:  '3日後に送信',
    },
    {
      stepNumber: 3,
      title:      'ステップ3',
      message:    `こんにちは！大口神経整体院です😊\n\n[メッセージ内容をここに入力してください]\n\nご質問等ございましたらお気軽にご連絡ください。`,
      delayDays:  7,
      delayHours: 0,
      condition:  '7日後に送信',
    },
  ],
};

function mockScenario(input: ScenarioGenInput): GeneratedStep[] {
  const fn = MOCK_STEPS[input.scenarioType] ?? MOCK_STEPS.custom;
  const steps = fn(input.theme, input.tone);
  return steps.slice(0, Math.min(input.stepCount, steps.length));
}

// ─── LLM プロンプト ────────────────────────────────────
function buildScenarioPrompt(
  input: ScenarioGenInput,
  brandContext: string,
  clinicName: string,
): string {
  const toneGuide =
    input.tone === 'friendly' ? 'やわらかく親しみやすい丁寧語' :
    input.tone === 'formal'   ? '丁寧でプロフェッショナルな敬語' :
                                'フレンドリーでカジュアルな口調';

  const scenarioLabel = SCENARIO_TYPE_LABELS[input.scenarioType];

  return `あなたは日本の治療院の LINE 配信シナリオ担当者です。以下の条件でステップ配信シナリオを作成してください。

【院情報】
院名: ${clinicName}
ブランド情報: ${brandContext}

【シナリオ条件】
シナリオ種別: ${scenarioLabel}
テーマ: ${input.theme}
ターゲット: ${input.target || '患者様'}
ステップ数: ${input.stepCount}
文体: ${toneGuide}

【要件】
- LINE メッセージとして自然な長さ（各200〜400字）
- 絵文字を適度に使用（過剰不可）
- 医療広告ガイドライン遵守（「治る」「必ず効く」等禁止）
- ${clinicName}として一人称で書く
- ステップ間の時間的な流れを意識する
- シナリオ全体として一貫したストーリーにする

以下のJSON形式で出力してください（前後の説明不要、JSONのみ）:
[
  {
    "stepNumber": 1,
    "title": "ステップタイトル（15字以内）",
    "message": "LINEメッセージ本文（改行は\\nで表現）",
    "delayDays": 0,
    "delayHours": 0,
    "condition": "送信タイミングの説明（例: 予約完了直後）"
  }
]

ステップ数は必ず${input.stepCount}にしてください。`;
}

// ─── 生成メイン ────────────────────────────────────────
export async function generateLineScenario(
  input:      ScenarioGenInput,
  clinicName: string,
): Promise<GeneratedStep[]> {
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
    return mockScenario(input);
  }

  const brandContext = await buildBrandContext(input.clinicId);
  const { generateText } = await import('@/lib/ai/client');
  const prompt = buildScenarioPrompt(input, brandContext, clinicName);

  try {
    const result = await generateText({ prompt, maxTokens: 2000 });
    const text = result.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('JSON array not found in AI response');

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('[lineScenarioGenerator] JSON parse failed:', parseErr);
      throw new Error('AIの生成結果をJSONとしてパースできませんでした');
    }

    return validateGeneratedSteps(parsed);
  } catch (err) {
    console.error('[lineScenarioGenerator] Falling back to mock:', err);
    return mockScenario(input);
  }
}
