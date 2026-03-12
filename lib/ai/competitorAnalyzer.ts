import { IS_MOCK_MODE } from './client';
import type { CompetitorInput, CompetitorAnalysis } from '@/types';

// ─── モック分析 ────────────────────────────────────────
function buildMockAnalysis(
  input:      CompetitorInput,
  clinicName: string,
): CompetitorAnalysis {
  const name = input.competitorName || '競合院';
  const types = input.compareTypes;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const winningPoints: string[] = [];
  const missingContent: string[] = [];
  const nextActions: string[] = [];

  if (types.includes('seo')) {
    strengths.push(`「${name}」はSEOコンテンツ量が豊富で、症状別ページを多数保有している`);
    weaknesses.push('各ページのコンテンツが薄く、E-E-A-T（専門性・信頼性）の訴求が不足している');
    winningPoints.push(`${clinicName}は専門的な施術説明と症状解説で差別化できる`);
    missingContent.push('症状別の深掘りコンテンツ（原因・メカニズム・施術方針）');
    nextActions.push('症状ページのコンテンツ強化（1,500字以上・専門用語の解説付き）');
  }

  if (types.includes('meo')) {
    strengths.push(`Googleマップの口コミ件数が多く、平均評価が高い（推定4.2以上）`);
    weaknesses.push('口コミへの返信がない・または定型文のみで、院のキャラクターが伝わらない');
    winningPoints.push('口コミへのていねいな個別返信で、院の人柄と対応力をアピールできる');
    nextActions.push('既存患者への口コミ依頼フローを整備し、月3件以上を目標に取得する');
  }

  if (types.includes('lp')) {
    strengths.push('LP上部のファーストビューにキャッチコピーと施術メリットが明示されている');
    weaknesses.push('ビフォーアフター事例や患者の声が少なく、成果への信頼性が弱い');
    winningPoints.push(`具体的な改善事例・症例数の提示で${clinicName}の実績を示す`);
    missingContent.push('患者インタビュー動画・写真コンテンツ');
    nextActions.push('LPにビフォーアフター事例を3〜5件追加し、具体的な改善内容を記載する');
  }

  if (types.includes('instagram')) {
    strengths.push('Instagram投稿頻度が高く（週4〜5回）、フォロワーとのエンゲージメントが活発');
    weaknesses.push('投稿内容が施術紹介に偏り、健康情報・患者向け教育コンテンツが少ない');
    winningPoints.push('健康情報や予防ケアのコンテンツで専門家としての権威性を確立できる');
    missingContent.push('セルフケア動画・症状解説のリール投稿');
    nextActions.push('週1回のリール投稿（症状改善ストーリー・セルフケア紹介）を開始する');
  }

  if (types.includes('appeal')) {
    strengths.push('「即効性」「料金の安さ」を前面に打ち出した分かりやすい訴求をしている');
    weaknesses.push('根本改善・再発防止への訴求が弱く、長期的な価値提供が伝わりにくい');
    winningPoints.push(`${clinicName}は「根本原因へのアプローチ」と「再発防止」を強みとして差別化できる`);
    nextActions.push('「なぜ再発するのか」「根本から変わるとは何か」を解説するコンテンツを作成する');
  }

  // 共通
  winningPoints.push('ブランド辞書に基づく一貫したコンテンツ戦略で、信頼感のある院のイメージを構築できる');
  missingContent.push('院長・スタッフの専門性・経歴を前面に出したプロフィールページ');
  nextActions.push(`3ヶ月間の重点強化テーマを決め、${clinicName}のコンテンツカレンダーを策定する`);

  return {
    strengths,
    weaknesses,
    appealFeatures:  `${name}の訴求は「${types.includes('appeal') ? '価格・即効性' : '認知度・口コミ'}」を軸に展開されており、幅広いターゲットを狙ったマス訴求が中心。専門特化よりも親しみやすさを重視したコミュニケーション戦略をとっている。`,
    estimatedTarget: `${name}のターゲット像は「はじめて整体・整骨院を探している20〜40代の一般層」と推定される。症状への共感訴求より、価格と利便性（アクセス・予約のしやすさ）を重視した層にリーチしている。`,
    winningPoints,
    missingContent,
    nextActions,
  } satisfies CompetitorAnalysis;
}

// ─── メイン関数 ────────────────────────────────────────
export async function analyzeCompetitor(
  input:       CompetitorInput,
  clinicName:  string,
): Promise<CompetitorAnalysis> {
  if (IS_MOCK_MODE) {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    return buildMockAnalysis(input, clinicName);
  }

  // ── 本番LLM ──────────────────────────────────────────
  const { generateText } = await import('./client');

  const COMPARE_LABELS: Record<string, string> = {
    seo:       'SEOコンテンツ',
    meo:       'MEO・Googleビジネスプロフィール',
    lp:        'ランディングページ（LP）',
    instagram: 'Instagram運用',
    appeal:    '訴求・マーケティング戦略',
  };
  const compareLabels = input.compareTypes
    .map((t) => COMPARE_LABELS[t] ?? t)
    .join('、');

  const prompt = `あなたは日本の治療院・整骨院専門のマーケティングアドバイザーです。以下の競合情報を分析してください。

【自院名】${clinicName}
【競合院名】${input.competitorName || '競合院'}
【競合URL】${input.url || '未入力'}
【分析観点】${compareLabels}

【競合院のテキスト・コンテンツ情報】
${input.pageText}

以下のJSON形式のみで回答してください（前後の説明・コードブロック不要）:
{
  "strengths":       ["競合の強み（具体的に）", "..."],
  "weaknesses":      ["競合の弱みや課題", "..."],
  "appealFeatures":  "競合の訴求特徴まとめ（150字程度の文章）",
  "estimatedTarget": "競合の推定ターゲット像（150字程度の文章）",
  "winningPoints":   ["${clinicName}が競合に勝てる具体的なポイント", "..."],
  "missingContent":  ["競合に不足しているコンテンツや機会", "..."],
  "nextActions":     ["${clinicName}が取るべき次のアクション（具体的に）", "..."]
}`;

  try {
    const result = await generateText({ prompt, maxTokens: 2500 });
    const parsed = JSON.parse(result.text.trim()) as CompetitorAnalysis;
    if (!Array.isArray(parsed.strengths) || !Array.isArray(parsed.weaknesses)) {
      throw new Error('invalid structure');
    }
    return parsed;
  } catch {
    return buildMockAnalysis(input, clinicName);
  }
}
