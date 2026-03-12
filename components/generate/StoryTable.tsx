'use client';

import { useState } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import type { StorySlide } from '@/types';

interface Props {
  slides:     StorySlide[];
  accentBg:   string;
  accentText: string;
}

// CSV エクスポート
function slidesToCsv(slides: StorySlide[]): string {
  const header = ['ページ', '上段テキスト', '画像指示', '下段リード文', 'タイトル候補1', 'タイトル候補2', 'タイトル候補3', 'CTA', 'ハッシュタグ'];
  const rows = slides.map((s) => [
    String(s.page),
    s.upperText,
    s.imageInstruction,
    s.lowerText,
    s.titleCandidates[0] ?? '',
    s.titleCandidates[1] ?? '',
    s.titleCandidates[2] ?? '',
    s.ctaText,
    s.hashtags.join(' '),
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function downloadCsv(slides: StorySlide[]) {
  const csv = '\uFEFF' + slidesToCsv(slides); // BOM付きUTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `instagram_story_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// テキスト一括コピー（タブ区切り）
function slidesToTabText(slides: StorySlide[]): string {
  const header = ['ページ', '上段テキスト', '画像指示', '下段リード文', 'タイトル候補1', 'タイトル候補2', 'タイトル候補3', 'CTA', 'ハッシュタグ'].join('\t');
  const rows = slides.map((s) =>
    [
      String(s.page),
      s.upperText,
      s.imageInstruction,
      s.lowerText,
      s.titleCandidates[0] ?? '',
      s.titleCandidates[1] ?? '',
      s.titleCandidates[2] ?? '',
      s.ctaText,
      s.hashtags.join(' '),
    ].join('\t'),
  );
  return [header, ...rows].join('\n');
}

const COL_WIDTHS: Record<string, string> = {
  ページ:         'w-12 shrink-0',
  上段テキスト:   'w-40 shrink-0',
  画像指示:       'w-56 shrink-0',
  下段リード文:   'w-48 shrink-0',
  タイトル候補1:  'w-40 shrink-0',
  タイトル候補2:  'w-40 shrink-0',
  タイトル候補3:  'w-40 shrink-0',
  CTA:            'w-36 shrink-0',
  ハッシュタグ:   'min-w-48 flex-1',
};

const COLUMNS = Object.keys(COL_WIDTHS);

export function StoryTable({ slides, accentBg, accentText }: Props) {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(slidesToTabText(slides));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div>
      {/* ツールバー */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-xs text-slate-500 flex-1">
          Canva / スプレッドシートへ貼り付け可能なフォーマットです
        </p>
        <button
          onClick={handleCopyAll}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition font-medium',
            copiedAll
              ? 'bg-green-100 border-green-200 text-green-700'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
          )}
        >
          {copiedAll ? <Check size={12} /> : <Copy size={12} />}
          {copiedAll ? 'コピー済み' : '表をコピー'}
        </button>
        <button
          onClick={() => downloadCsv(slides)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium"
        >
          <Download size={12} />
          CSVダウンロード
        </button>
      </div>

      {/* テーブル本体（横スクロール） */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <div className="min-w-max">
          {/* ヘッダー */}
          <div className={cn('flex px-3 py-2.5 gap-3', accentBg)}>
            {COLUMNS.map((col) => (
              <div key={col} className={cn('text-xs font-semibold text-white', COL_WIDTHS[col])}>
                {col}
              </div>
            ))}
          </div>

          {/* 行 */}
          {slides.map((slide, rowIdx) => (
            <div
              key={slide.page}
              className={cn(
                'flex px-3 py-3 gap-3 border-b border-slate-100 last:border-0',
                rowIdx % 2 === 1 ? 'bg-slate-50' : 'bg-white',
              )}
            >
              {/* ページ番号 */}
              <div className={cn('text-sm font-bold', COL_WIDTHS['ページ'], accentText)}>
                P{slide.page}
              </div>

              {/* 上段テキスト */}
              <div className={cn('text-xs text-slate-700 leading-relaxed', COL_WIDTHS['上段テキスト'])}>
                {slide.upperText}
              </div>

              {/* 画像指示 */}
              <div className={cn('text-xs text-slate-500 leading-relaxed', COL_WIDTHS['画像指示'])}>
                {slide.imageInstruction}
              </div>

              {/* 下段リード文 */}
              <div className={cn('text-xs text-slate-700 whitespace-pre-wrap leading-relaxed', COL_WIDTHS['下段リード文'])}>
                {slide.lowerText}
              </div>

              {/* タイトル候補 */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={cn(
                    'text-xs text-slate-600 leading-relaxed',
                    COL_WIDTHS[`タイトル候補${i + 1}`],
                  )}
                >
                  {slide.titleCandidates[i] ?? '—'}
                </div>
              ))}

              {/* CTA */}
              <div className={cn('text-xs text-slate-700 font-medium', COL_WIDTHS['CTA'])}>
                {slide.ctaText || '—'}
              </div>

              {/* ハッシュタグ */}
              <div className={cn('text-xs text-slate-500 break-all leading-relaxed', COL_WIDTHS['ハッシュタグ'])}>
                {slide.hashtags.length > 0 ? slide.hashtags.join(' ') : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
