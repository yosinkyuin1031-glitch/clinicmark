/**
 * ブランドプロフィール サービス層
 *
 * getOrCreateProfile  - 取得（なければ空レコード作成）
 * upsertProfile       - 保存（作成 or 更新）
 * getProfileForPrompt - AI プロンプト用テキスト生成
 * exportProfileAsJson - JSON エクスポート用オブジェクト生成
 *
 * ユーティリティ
 * parseLines          - "a\nb\nc" → ["a","b","c"]  (空行除去)
 * formatLines         - ["a","b","c"] → "a\nb\nc"
 */

import { prisma } from '@/lib/db/prisma';
import type { ClinicBrandProfileInput, BrandProfileExport } from '@/types';

// ─── ユーティリティ ───────────────────────────────────
export function parseLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export function formatLines(arr: string[]): string {
  return arr.join('\n');
}

// ─── 取得（なければ空レコードを作成して返す） ─────────
export async function getOrCreateProfile(clinicId: string) {
  const existing = await prisma.clinicBrandProfile.findUnique({
    where: { clinicId },
  });
  if (existing) return existing;

  return prisma.clinicBrandProfile.create({
    data: { clinicId },
  });
}

// ─── 保存（upsert） ───────────────────────────────────
export async function upsertProfile(
  clinicId: string,
  data: ClinicBrandProfileInput,
) {
  return prisma.clinicBrandProfile.upsert({
    where: { clinicId },
    create: { clinicId, ...data },
    update: data,
  });
}

// ─── AI プロンプト用テキスト ──────────────────────────
export async function getProfileForPrompt(clinicId: string): Promise<string> {
  const profile = await prisma.clinicBrandProfile.findUnique({
    where: { clinicId },
  });

  if (!profile) return '';

  const lines: string[] = ['【院基本情報】'];

  if (profile.description)
    lines.push(`院の説明: ${profile.description}`);

  if (profile.brandTone)
    lines.push(`ブランドトーン: ${profile.brandTone}`);

  if (profile.primaryKeywords) {
    const kws = parseLines(profile.primaryKeywords);
    if (kws.length) lines.push(`主要キーワード: ${kws.join(' / ')}`);
  }

  if (profile.areaKeywords) {
    const kws = parseLines(profile.areaKeywords);
    if (kws.length) lines.push(`地域キーワード: ${kws.join(' / ')}`);
  }

  if (profile.greeting)
    lines.push(`固定挨拶文: ${profile.greeting}`);

  if (profile.ctaText)
    lines.push(`CTA文: ${profile.ctaText}`);

  if (profile.recommendedPhrases) {
    const phrases = parseLines(profile.recommendedPhrases);
    if (phrases.length) lines.push(`推奨表現: ${phrases.join(' / ')}`);
  }

  if (profile.forbiddenPhrases) {
    const phrases = parseLines(profile.forbiddenPhrases);
    if (phrases.length) lines.push(`禁止表現: ${phrases.join(' / ')}`);
  }

  if (profile.notes)
    lines.push(`備考: ${profile.notes}`);

  // 実質空なら何も返さない
  if (lines.length <= 1) return '';

  return lines.join('\n');
}

// ─── JSON エクスポート ────────────────────────────────
export async function exportProfileAsJson(
  clinicId: string,
): Promise<BrandProfileExport> {
  const [clinic, profile, entries] = await Promise.all([
    prisma.clinic.findUniqueOrThrow({ where: { id: clinicId } }),
    prisma.clinicBrandProfile.findUnique({ where: { clinicId } }),
    prisma.brandEntry.findMany({
      where: { clinicId, isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    }),
  ]);

  // BrandEntry をカテゴリ別にグループ化
  const brandEntries: BrandProfileExport['brandEntries'] = {};
  for (const e of entries) {
    if (!brandEntries[e.category]) brandEntries[e.category] = [];
    brandEntries[e.category].push({ key: e.key, value: e.value });
  }

  return {
    clinicName: clinic.name,
    exportedAt: new Date().toISOString(),
    profile: {
      description:        profile?.description        ?? '',
      brandTone:          profile?.brandTone           ?? '',
      primaryKeywords:    parseLines(profile?.primaryKeywords    ?? ''),
      areaKeywords:       parseLines(profile?.areaKeywords       ?? ''),
      greeting:           profile?.greeting            ?? '',
      ctaText:            profile?.ctaText             ?? '',
      recommendedPhrases: parseLines(profile?.recommendedPhrases ?? ''),
      forbiddenPhrases:   parseLines(profile?.forbiddenPhrases   ?? ''),
      notes:              profile?.notes               ?? '',
    },
    brandEntries,
  };
}
