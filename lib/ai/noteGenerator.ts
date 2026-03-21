import { IS_MOCK_MODE } from '@/lib/ai/client';
import type { NoteGenInput, NoteGenResult } from '@/types';

// ─── noteType 別文体ガイド ──────────────────────────────
const NOTE_TYPE_GUIDE: Record<NoteGenInput['noteType'], string> = {
  story:     '患者さんの体験・変化を一人称（院長目線または患者目線）で語る読み物。感情の流れを大切に、共感を呼ぶ構成にする。',
  knowledge: '症状・原因・対策を分かりやすく解説するお役立ち記事。見出し・箇条書きを活用して読みやすくする。',
  column:    '院長の考え・独自視点をエッセイ調で語るコラム。専門知識を交えつつも親しみやすい文体で書く。',
};

// ─── 文体ガイド ─────────────────────────────────────────
const WRITING_STYLE_GUIDE: Record<NoteGenInput['writingStyle'], string> = {
  friendly: '親しみやすい丁寧語（です・ます調）。絵文字は控えめに。読者との距離感が近く、温かみがある。',
  formal:   '丁寧で落ち着いたプロフェッショナルな文体。信頼感・専門性を強調。',
  casual:   '柔らかくカジュアルな文体。話しかけるような口調。親近感を最優先。',
};

// ─── モックタイトル生成 ──────────────────────────────────
function buildMockTitles(input: NoteGenInput, clinicName: string): string[] {
  const { theme, noteType } = input;
  if (noteType === 'story') {
    return [
      `「${theme}」が改善した日のこと—私が感じた変化を正直に書きます`,
      `半年間悩んだ${theme}が楽になるまでのリアルな話`,
      `${clinicName}に来て変わったこと：${theme}との戦いを振り返る`,
    ];
  }
  if (noteType === 'knowledge') {
    return [
      `【保存版】${theme}の原因と自分でできる対策まとめ`,
      `知らないと損する！${theme}が繰り返す本当の理由`,
      `${theme}でお悩みの方へ：整体師が教える3つのポイント`,
    ];
  }
  // column
  return [
    `なぜ${theme}は「安静にしていれば治る」ではないのか`,
    `${theme}と向き合って気づいた、体と心の関係性`,
    `院長が考える「${theme}」—根本改善とは何か`,
  ];
}

// ─── モック本文生成 ──────────────────────────────────────
function buildMockBody(input: NoteGenInput, clinicName: string): string {
  const { theme, noteType, target, cta, charTarget } = input;

  if (noteType === 'story') {
    return `# ${theme}が改善した日のこと

はじめまして。${clinicName}の院長です。

今日は、ある患者さん（仮にAさんとします）のお話をご紹介したいと思います。Aさんが初めてご来院されたのは、${theme}に悩んで半年が過ぎた頃のことでした。

## 来院前の状態

${theme}の症状が出始めたのは、日常の何気ない動作がきっかけでした。最初は「少し休めば治るかな」と思っていたAさん。しかし、症状はなかなか改善せず、日常生活にも支障が出るようになっていました。

> 「もう一生こんな状態が続くのかな…」とあきらめかけていました

そんな言葉が、初回のカウンセリングで印象に残っています。

## 原因を探る

体を丁寧に診させていただくと、${theme}の背景にいくつかの要因が重なっていることが分かりました。

- 筋肉のバランスの乱れ
- 神経の過緊張
- 日常の姿勢・動作パターンのクセ

どれか一つだけでなく、複数の要因が絡み合っているケースは非常に多いです。

## 施術と変化

根本原因にアプローチする施術を続けていただいたところ、3回目の来院後あたりから「あれ、少し楽かも？」という変化が。

${charTarget > 1500 ? `\n## さらに深い変化\n\nその後も定期的にご来院いただく中で、単に${theme}が改善しただけでなく、体全体のコンディションが整ってきたとのこと。「朝起きた時の体の重さが違う」「仕事中の集中力が上がった気がする」といったお声もいただきました。\n` : ''}

最終的に、Aさんは「${theme}がない日常」を取り戻されました。

## 最後に

${theme}でお悩みの${target || '方'}に、ぜひ知っていただきたいことがあります。「痛みは我慢するもの」ではありません。適切なアプローチで、体は必ず応えてくれます。

${cta ? `**${cta}**` : 'まずはお気軽にご相談ください。'}

---

*この記事は実際の症例をもとに、プライバシーに配慮して再構成したものです。*`;
  }

  if (noteType === 'knowledge') {
    return `# 【保存版】${theme}の原因と対策：整体師が解説します

こんにちは、${clinicName}の院長です。

今回は「${theme}」について、多くの方からよくいただく疑問にお答えしながら、原因と対策を詳しく解説します。

## ${theme}とは？

${theme}は、${target || '多くの方'}が一度は経験する体の悩みの一つです。「少し休めば治るだろう」と思いがちですが、放置すると慢性化するケースも少なくありません。

## 主な原因3つ

### 1. 筋肉・筋膜のバランスの乱れ
長時間同じ姿勢を続けると、特定の筋肉に負担が集中します。これが${theme}の引き金になることがよくあります。

### 2. 神経の過緊張
ストレスや疲労が蓄積すると、神経が過敏になり、本来は問題ない刺激にも痛みとして反応するようになります。

### 3. 骨格・関節のアライメントの問題
日常の動作のクセや過去のケガが影響し、骨格のバランスが崩れていることがあります。

${charTarget > 1500 ? `\n## よくある間違いとその対処法\n\n### 「安静にしていれば治る」は本当か？\n急性期（炎症が強い時期）は安静も大切ですが、慢性的な${theme}の場合、動かさないでいると逆に筋肉が固まって悪化することもあります。\n\n### 「揉めば治る」は本当か？\nマッサージで一時的に楽になることはありますが、根本原因にアプローチしないと繰り返します。\n` : ''}

## 自分でできる対策

1. **ストレッチを習慣に**：朝晩5分のストレッチで筋肉の柔軟性を保つ
2. **姿勢を意識する**：デスクワーク中は1時間に1回、姿勢をリセット
3. **睡眠環境を整える**：枕の高さや寝具の硬さを見直す

## まとめ

${theme}は、正しいアプローチで改善できます。「もう治らない」と諦める前に、ぜひ一度ご相談ください。

${cta ? `**${cta}**` : '初回のご相談はお気軽にどうぞ。'}`;
  }

  // column
  return `# ${theme}について考えてみた

${clinicName}の院長です。

今日は少し違う切り口で、「${theme}」というテーマについて私が日々感じていることを書いてみようと思います。

## 「治す」より「整える」という発想

患者さんと話していると、よく「先生、これ、治りますか？」という質問をいただきます。

正直なことを言うと、私は「治す」という言葉をあまり使いません。代わりに「整える」という表現を大切にしています。

${theme}も同じです。体というのは非常に複雑なシステムで、一つの症状には必ず複数の要因が絡んでいます。

${charTarget > 1500 ? `\n## 体と心のつながり\n\n長年この仕事をしていて感じるのは、体の症状と心の状態が密接につながっているということです。\n\n${theme}で来院される方の中には、仕事や人間関係のストレスを抱えているケースも少なくありません。体を「整える」過程で、心も少し軽くなったと話してくれる患者さんもいます。\n` : ''}

## 私が大切にしていること

施術の技術はもちろん大切ですが、それ以上に「その人の話をきちんと聞くこと」を私は大切にしています。

症状の背景には、その人の生活習慣、仕事環境、人生のストーリーがあります。それを理解せずに、表面的な症状だけを見ていては、本当の意味でのサポートはできないと思っています。

## 最後に

${target || 'お体のことでお悩みの方'}、一人で抱え込まないでください。

${cta ? `**${cta}**` : 'いつでもお声がけください。'}`;
}

// ─── モックハッシュタグ生成 ──────────────────────────────
function buildMockHashtags(input: NoteGenInput): string[] {
  const { theme, target } = input;
  const base = [
    `#${theme}`,
    '#整体',
    '#鍼灸',
    '#治療院',
    '#健康',
    '#体の悩み',
    '#ウェルネス',
    '#セルフケア',
  ];
  const extra: string[] = [];
  if (target) {
    const t = target.replace(/\s/g, '');
    if (t.length <= 10) extra.push(`#${t}`);
  }
  extra.push('#note', '#健康情報', '#院長コラム', '#整体師', '#根本改善');
  return [...base, ...extra].slice(0, 8);
}

// ─── モック SEO メモ ─────────────────────────────────────
function buildMockSeoMemo(input: NoteGenInput): string {
  const { theme } = input;
  return `【note SEO のポイント】
・タイトルに「${theme}」を入れると検索に引っかかりやすくなります
・記事冒頭200文字に「${theme}」「原因」「改善」などのキーワードを自然に含める
・見出し（H2/H3）にもキーワードを入れると効果的
・note は外部SEOより「フォロワーへの拡散」が重要。ハッシュタグを活用しましょう
・記事末尾のCTAで公式LINE/予約ページへの導線を必ず設けてください`;
}

// ─── メイン生成関数 ──────────────────────────────────────
export async function generateNote(
  input:        NoteGenInput,
  brandContext: string,
  clinicName:   string,
): Promise<Omit<NoteGenResult, 'contentId' | 'durationMs' | 'charCount'>> {
  // ── 本番LLM ──────────────────────────────────────────
  if (!IS_MOCK_MODE) {
    try {
      const { generateText } = await import('@/lib/ai/client');

      const prompt = `あなたはnote.comで発信する日本の治療院（整体院・鍼灸院）の院長です。
以下の条件でnote記事の下書きを生成してください。

【院名】${clinicName}
【テーマ】${input.theme}
【記事種別】${NOTE_TYPE_GUIDE[input.noteType]}
【ターゲット読者】${input.target || '体の悩みを持つ一般の方'}
【目標文字数】${input.charTarget}文字程度
【文体】${WRITING_STYLE_GUIDE[input.writingStyle]}
【CTA】${input.cta || 'まずはお気軽にご相談ください'}
【ブランド情報】${brandContext}

注意事項：
- 「治る」「完治」「効果がある（断言形）」などの医療広告ガイドライン違反表現は使わない
- 患者個人情報は一切扱わない
- Markdown形式で出力（noteエディタに貼り付け可能）
- 本文は目標文字数に近づけること

以下のJSON形式のみで回答してください（コードブロック・前置き説明不要）:
{
  "titles": ["タイトル案1（魅力的・SEO意識）", "タイトル案2（体験談調）", "タイトル案3（お役立ち調）"],
  "body": "Markdown形式の本文（目標${input.charTarget}文字程度）",
  "hashtags": ["#タグ1", "#タグ2", ...（5〜8個）],
  "seoMemo": "note SEO・拡散のためのポイントメモ（100字程度）"
}`;

      const result = await generateText({ prompt, maxTokens: 4000 });
      const parsed = JSON.parse(result.text.trim()) as {
        titles: string[];
        body: string;
        hashtags: string[];
        seoMemo: string;
      };
      if (parsed.titles && parsed.body) {
        return {
          titles:   parsed.titles,
          body:     parsed.body,
          hashtags: parsed.hashtags ?? [],
          seoMemo:  parsed.seoMemo ?? '',
        };
      }
    } catch {
      // フォールバックへ
    }
  }

  // ── モック or フォールバック ──────────────────────────
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
  }

  return {
    titles:   buildMockTitles(input, clinicName),
    body:     buildMockBody(input, clinicName),
    hashtags: buildMockHashtags(input),
    seoMemo:  buildMockSeoMemo(input),
  };
}
