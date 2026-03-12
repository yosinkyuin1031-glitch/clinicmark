import { prisma } from '@/lib/db/prisma';
import type { BrandCategory } from '@/types';
type BrandEntry = { category: string; key: string; value: string };
import { BRAND_CATEGORY_LABELS } from '@/types';
import { getProfileForPrompt } from '@/lib/services/brandProfile';

// ─── ブランドコンテキスト文字列を組み立て ─────────────
// 1) 院基本プロフィール（ClinicBrandProfile）
// 2) 辞書エントリー（BrandEntry: TONE/TARGET/SERVICE...）
export async function buildBrandContext(clinicId: string): Promise<string> {
  // プロフィールセクション
  const profileSection = await getProfileForPrompt(clinicId);

  // 辞書エントリーセクション
  const entries = await prisma.brandEntry.findMany({
    where: { clinicId, isActive: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  });

  let entrySection = '';
  if (entries.length > 0) {
    const grouped = entries.reduce<Record<string, BrandEntry[]>>((acc, entry) => {
      const cat = entry.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(entry);
      return acc;
    }, {});

    const lines: string[] = ['【ブランド辞書】'];
    for (const [category, catEntries] of Object.entries(grouped)) {
      const label = BRAND_CATEGORY_LABELS[category as BrandCategory] ?? category;
      lines.push(`[${label}]`);
      for (const e of catEntries) {
        lines.push(`・${e.key}: ${e.value}`);
      }
    }
    entrySection = lines.join('\n');
  }

  const sections = [profileSection, entrySection].filter(Boolean);
  if (sections.length === 0) return '（ブランド情報未設定）';
  return sections.join('\n\n');
}

// ─── 高評価コンテンツを媒体別に取得（Few-shot 例として活用） ──
export async function fetchGoodExamples(
  clinicId:   string,
  mediaTypes: string[],
  limit:      number = 2,
): Promise<Partial<Record<string, string[]>>> {
  if (mediaTypes.length === 0) return {};

  const records = await prisma.generatedContent.findMany({
    where: {
      clinicId,
      rating: 'good',
      type:   { in: mediaTypes },
    },
    orderBy: { updatedAt: 'desc' },
    select:  { type: true, output: true },
  });

  // 媒体タイプ別に最大 limit 件を収集
  const result: Partial<Record<string, string[]>> = {};
  for (const record of records) {
    const list = result[record.type] ?? [];
    if (list.length < limit) {
      list.push(record.output);
      result[record.type] = list;
    }
  }
  return result;
}

// ─── 👍👎 フィードバックブロックをプロンプト用に整形 ──────────
// contentType に対して好評・不評を最大数件取得し、
// Claude への指示テキストに変換する。
// 評価が 0 件の場合は空文字を返すので、プロンプトは変わらない。
export async function buildFeedbackBlock(
  clinicId:    string,
  contentType: string,   // 'INSTAGRAM_POST' / 'META_AD' / 'FAQ' など
): Promise<string> {
  const [goodRecords, badRecords] = await Promise.all([
    prisma.generatedContent.findMany({
      where:   { clinicId, rating: 'good', type: contentType },
      orderBy: { updatedAt: 'desc' },
      take:    3,
      select:  { output: true },
    }),
    prisma.generatedContent.findMany({
      where:   { clinicId, rating: 'bad', type: contentType },
      orderBy: { updatedAt: 'desc' },
      take:    2,
      select:  { output: true },
    }),
  ]);

  if (goodRecords.length === 0 && badRecords.length === 0) return '';

  const lines: string[] = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '【学習フィードバック（この院での評価履歴）】',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  ];

  if (goodRecords.length > 0) {
    lines.push('');
    lines.push('▼ 過去に「良い」と評価されたコンテンツ例');
    lines.push('  ↳ このトーン・構成・表現スタイルを参考にしてください');
    goodRecords.forEach((r, i) => {
      lines.push(`\n─── 参考例 ${i + 1} ───`);
      // 長すぎる場合は先頭700文字に制限
      lines.push(r.output.slice(0, 700) + (r.output.length > 700 ? '\n…（省略）' : ''));
    });
  }

  if (badRecords.length > 0) {
    lines.push('');
    lines.push('▼ 過去に「良くない」と評価されたコンテンツ例');
    lines.push('  ↳ このスタイル・表現・構成は避けてください');
    badRecords.forEach((r, i) => {
      lines.push(`\n─── NG例 ${i + 1} ───`);
      lines.push(r.output.slice(0, 450) + (r.output.length > 450 ? '\n…（省略）' : ''));
    });
  }

  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

// ─── プロンプトテンプレート変数置換 ───────────────────
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    return variables[key] ?? `{{${key}}}`;
  });
}

// ─── テンプレート＋ブランド情報＋フィードバック学習を組み合わせてプロンプト生成 ──
// contentType を指定すると 👍👎 学習ブロックが自動で注入される
export async function buildFullPrompt(
  templateId:   string,
  clinicId:     string,
  userInputs:   Record<string, string>,
  contentType?: string,   // ← 追加: 指定で学習フィードバックを自動投入
): Promise<string> {
  // テンプレート取得
  const template = await prisma.contentTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error(`テンプレートが見つかりません: ${templateId}`);

  // 院情報取得
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
  });
  if (!clinic) throw new Error(`院が見つかりません: ${clinicId}`);

  // ブランドコンテキスト＋フィードバックブロックを並行取得
  const [brandContext, feedbackBlock] = await Promise.all([
    buildBrandContext(clinicId),
    contentType ? buildFeedbackBlock(clinicId, contentType) : Promise.resolve(''),
  ]);

  // 全変数を合体（院情報＋ブランド＋フィードバック＋ユーザー入力）
  const allVariables: Record<string, string> = {
    clinicName:    clinic.name,
    brandContext,
    feedbackBlock, // テンプレートに {{feedbackBlock}} があれば差し込まれる
    ...userInputs,
  };

  let prompt = interpolateTemplate(template.promptTemplate, allVariables);

  // テンプレートに {{feedbackBlock}} がない場合は末尾に自動付加
  if (feedbackBlock && !template.promptTemplate.includes('{{feedbackBlock}}')) {
    prompt = prompt + '\n\n' + feedbackBlock;
  }

  return prompt;
}
