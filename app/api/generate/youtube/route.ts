import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateText, IS_MOCK_MODE } from '@/lib/ai/client';
import { buildBrandContext } from '@/lib/ai/buildPrompt';
import { z } from 'zod';

const schema = z.object({
  clinicId:         z.string().min(1),
  theme:            z.string().min(1, 'テーマを入力してください'),
  videoType:        z.enum(['short', 'standard', 'long']).default('standard'),
  target:           z.string().default(''),
  tone:             z.enum(['friendly', 'professional', 'casual', 'energetic']).default('friendly'),
  includeThumbnail: z.boolean().default(true),
  keywords:         z.string().default(''),
});

// ─── Mock data ───────────────────────────────────────────
function getMockResult(theme: string, videoType: string, includeThumbnail: boolean) {
  const typeLabel = videoType === 'short' ? '60秒ショート' : videoType === 'standard' ? '5-10分' : '15-30分';
  return {
    titles: [
      `【${theme}】プロが教える改善法3選`,
      `${theme}で悩んでいませんか？今日からできるセルフケア`,
      `【保存版】${theme}の原因と対策を徹底解説`,
    ],
    thumbnailTexts: includeThumbnail
      ? [
          `${theme}はこれで解決！`,
          `知らないと損する${theme}の真実`,
          `プロ直伝！${theme}改善法`,
        ]
      : [],
    sections: videoType === 'short'
      ? [
          { timeCode: '0:00-0:05',  title: 'フック',   narration: `${theme}で悩んでいませんか？`, visualInstruction: '問いかけテロップ + 患部のイメージ映像' },
          { timeCode: '0:05-0:20',  title: '原因解説', narration: `実は${theme}の原因は日常生活にあります。`, visualInstruction: 'イラスト or 図解で原因を説明' },
          { timeCode: '0:20-0:50',  title: '改善法',   narration: '今日からできる簡単な方法を1つご紹介します。', visualInstruction: '施術者がセルフケアを実演' },
          { timeCode: '0:50-0:60',  title: 'CTA',      narration: '詳しくはプロフィールのリンクからどうぞ！', visualInstruction: '院のロゴ + 予約導線' },
        ]
      : [
          { timeCode: '0:00-0:30',  title: 'オープニング', narration: `こんにちは！今日は${theme}について詳しくお話しします。`, visualInstruction: '施術者が笑顔でカメラに向かって挨拶' },
          { timeCode: '0:30-2:00',  title: '問題提起',     narration: `${theme}に悩む方は非常に多いんです。`,           visualInstruction: 'データやグラフで現状を提示' },
          { timeCode: '2:00-5:00',  title: '原因解説',     narration: '主な原因は3つあります。',                        visualInstruction: 'イラスト図解で3つの原因を順に表示' },
          { timeCode: '5:00-8:00',  title: '改善方法',     narration: 'それぞれの原因に対する改善法をご紹介します。',   visualInstruction: '施術者がセルフケアを実演' },
          { timeCode: '8:00-9:30',  title: 'まとめ',       narration: '今日お話しした内容をおさらいしましょう。',       visualInstruction: 'ポイントをテロップでまとめ表示' },
          { timeCode: '9:30-10:00', title: 'エンディング', narration: 'チャンネル登録と高評価をお願いします！',         visualInstruction: '登録ボタンアニメーション + 院のロゴ' },
        ],
    fullScript: `【${typeLabel}動画台本】\n\n` +
      `テーマ: ${theme}\n\n` +
      `===== オープニング =====\n` +
      `こんにちは！今日は「${theme}」について、プロの視点からわかりやすくお伝えします。\n\n` +
      `===== 本編 =====\n` +
      `${theme}で悩んでいる方、実はとても多いんです。\n` +
      `その原因と、今日からすぐに実践できる改善法をご紹介していきます。\n\n` +
      `まず、${theme}の主な原因ですが...\n` +
      `1つ目は、日常の姿勢の乱れです。\n` +
      `2つ目は、運動不足による筋力低下。\n` +
      `3つ目は、ストレスによる筋緊張です。\n\n` +
      `では、それぞれの改善法を見ていきましょう。\n\n` +
      `===== エンディング =====\n` +
      `いかがでしたか？今日ご紹介した方法をぜひ試してみてください。\n` +
      `チャンネル登録と高評価ボタンを押していただけると励みになります！`,
    descriptionTemplate:
      `【${theme}】プロが教える改善法\n\n` +
      `この動画では、${theme}の原因と改善法について詳しく解説しています。\n\n` +
      `=== 目次 ===\n` +
      `00:00 オープニング\n` +
      `00:30 ${theme}の現状\n` +
      `02:00 原因解説\n` +
      `05:00 改善方法\n` +
      `08:00 まとめ\n\n` +
      `=== 関連動画 ===\n` +
      `（ここに関連動画のリンクを追加）\n\n` +
      `=== SNS ===\n` +
      `Instagram: @your_clinic\n` +
      `LINE: （公式LINEリンク）\n\n` +
      `#${theme.replace(/\s+/g, '')} #整体 #セルフケア #健康 #改善法`,
    cta: `この動画が参考になったら、ぜひチャンネル登録と高評価をお願いします！\n` +
      `もっと詳しく相談したい方は、概要欄のLINEリンクからお気軽にご連絡ください。\n` +
      `初回の方は特別価格でご案内しています！`,
  };
}

// ─── Prompt builder ──────────────────────────────────────
function buildYouTubePrompt(
  brandContext: string,
  clinicName: string,
  theme: string,
  videoType: string,
  target: string,
  tone: string,
  includeThumbnail: boolean,
  keywords: string,
) {
  const typeLabel = videoType === 'short' ? '60秒ショート動画' : videoType === 'standard' ? '5〜10分の標準動画' : '15〜30分のロング動画';
  const toneLabel: Record<string, string> = {
    friendly: 'やわらかく親しみやすい',
    professional: '専門的で信頼感のある',
    casual: 'カジュアルで気軽な',
    energetic: '元気でエネルギッシュな',
  };

  return `あなたは治療院・整体院のYouTubeマーケティング専門家です。
以下の情報をもとに、YouTube動画の台本を作成してください。

【院情報】
院名: ${clinicName}
${brandContext}

【依頼内容】
- テーマ: ${theme}
- 動画タイプ: ${typeLabel}
- ターゲット: ${target || '特に指定なし'}
- トーン: ${toneLabel[tone] || tone}
${keywords ? `- SEOキーワード: ${keywords}` : ''}
${includeThumbnail ? '- サムネイルテキスト候補も生成してください' : ''}

【出力形式】
以下のJSON形式で出力してください。JSON以外のテキストは含めないでください。

{
  "titles": ["タイトル候補1", "タイトル候補2", "タイトル候補3"],
  "thumbnailTexts": ${includeThumbnail ? '["サムネテキスト1", "サムネテキスト2", "サムネテキスト3"]' : '[]'},
  "sections": [
    {
      "timeCode": "0:00-0:30",
      "title": "セクション名",
      "narration": "このセクションのナレーション",
      "visualInstruction": "映像・テロップの指示"
    }
  ],
  "fullScript": "動画全体の台本テキスト（ナレーションを通しで記述）",
  "descriptionTemplate": "概要欄テンプレート（目次・SNSリンク・ハッシュタグ含む）",
  "cta": "CTA文（チャンネル登録・来院促進など）"
}

【ルール】
1. 「治る」「完治」「効果がある（断言形）」などの医療広告ガイドライン違反の表現は使わない
2. タイトルはクリックしたくなる魅力的なものにする（32文字以内推奨）
3. サムネイルテキストは短く、インパクトのある表現にする（15文字以内）
4. 動画構成はタイムコード付きで、視聴者が飽きない構成にする
5. 台本はナレーション形式で、口語体で書く
6. 概要欄には目次（タイムスタンプ）・SNSリンク枠・ハッシュタグを含める
7. 全て日本語で出力する
8. ${typeLabel}にふさわしい長さ・構成にする`;
}

// ─── Route handler ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { clinicId, theme, videoType, target, tone, includeThumbnail, keywords } = parsed.data;

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) return NextResponse.json({ error: '院が見つかりません' }, { status: 404 });

  const startTime = Date.now();

  // ── Mock mode ──
  if (IS_MOCK_MODE) {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
    const mockResult = getMockResult(theme, videoType, includeThumbnail);
    const durationMs = Date.now() - startTime;

    const savedContent = await prisma.generatedContent.create({
      data: {
        clinicId,
        type:        'YOUTUBE_SCRIPT',
        title:       `YouTube台本（${theme}）`,
        inputParams: JSON.stringify({ theme, videoType, target, tone, includeThumbnail, keywords }),
        output:      JSON.stringify(mockResult),
        status:      'DRAFT',
        rating:      'none',
        tags:        '[]',
        note:        '',
      },
    });

    return NextResponse.json({ data: { contentId: savedContent.id, result: mockResult, durationMs } });
  }

  // ── Real AI mode ──
  const brandContext = await buildBrandContext(clinicId);
  const prompt = buildYouTubePrompt(brandContext, clinic.name, theme, videoType, target, tone, includeThumbnail, keywords);

  const aiResult = await generateText({
    prompt,
    maxTokens: 4000,
  });

  let result;
  try {
    // Extract JSON from the response (handle markdown code blocks)
    let jsonStr = aiResult.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    result = JSON.parse(jsonStr);
  } catch {
    // Fallback: return raw text as fullScript
    result = {
      titles: [`YouTube動画: ${theme}`],
      thumbnailTexts: includeThumbnail ? [theme] : [],
      sections: [],
      fullScript: aiResult.text,
      descriptionTemplate: '',
      cta: '',
    };
  }

  const durationMs = Date.now() - startTime;

  const savedContent = await prisma.generatedContent.create({
    data: {
      clinicId,
      type:        'YOUTUBE_SCRIPT',
      title:       `YouTube台本（${theme}）`,
      inputParams: JSON.stringify({ theme, videoType, target, tone, includeThumbnail, keywords }),
      output:      JSON.stringify(result),
      status:      'DRAFT',
      rating:      'none',
      tags:        '[]',
      note:        '',
    },
  });

  await prisma.promptLog.create({
    data: {
      clinicId,
      contentId:    savedContent.id,
      model:        'claude-sonnet-4-5',
      inputTokens:  aiResult.inputTokens,
      outputTokens: aiResult.outputTokens,
      durationMs:   aiResult.durationMs,
    },
  });

  return NextResponse.json({ data: { contentId: savedContent.id, result, durationMs } });
}
