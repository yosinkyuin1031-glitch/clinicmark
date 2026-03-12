'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import { RatingButtons } from '@/components/library/RatingButtons';
import { CanvaButton } from '@/components/ui/CanvaButton';
import { MEDIA_TO_CANVA } from '@/lib/canva/client';
import type { OutputItem } from '@/types';

interface MultiOutputCardProps {
  item: OutputItem;
}

// 折りたたみが必要な行数の閾値（長いコンテンツのみ折りたたむ）
const COLLAPSE_LINES = 6;

export function MultiOutputCard({ item }: MultiOutputCardProps) {
  const [copied,   setCopied]   = useState(false);
  const [expanded, setExpanded] = useState(false);

  const lines      = item.content.split('\n');
  const isLong     = lines.length > COLLAPSE_LINES;
  const showToggle = isLong;
  const displayContent = !isLong || expanded
    ? item.content
    : lines.slice(0, COLLAPSE_LINES).join('\n') + '\n…';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        {/* ラベル */}
        <span className="text-xs font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
          {item.label}
        </span>

        {/* 文字数バッジ */}
        <span className="text-xs text-slate-500 ml-1">{item.charCount}文字</span>

        {/* 警告バッジ */}
        {item.warnings.length > 0 && (
          <div className="relative group ml-1">
            <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full cursor-help">
              <AlertTriangle size={11} />
              {item.warnings.length}件
            </span>
            {/* ツールチップ */}
            <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-64 bg-slate-800 text-white text-xs rounded-lg p-2 shadow-lg">
              {item.warnings.map((w, i) => (
                <p key={i} className="mb-0.5 last:mb-0">・{w}</p>
              ))}
            </div>
          </div>
        )}

        {/* 右側：評価ボタン + Canvaボタン + コピーボタン */}
        <div className="ml-auto flex items-center gap-2">
          {/* 評価ボタン（DB 保存済みのときのみ表示） */}
          {item.contentId && (
            <RatingButtons
              contentId={item.contentId}
              initialRating="none"
              size="sm"
            />
          )}

          {/* Canva ボタン（対応する媒体タイプの場合のみ表示） */}
          {MEDIA_TO_CANVA[item.mediaType] && (
            <CanvaButton
              content={item.content}
              designType={MEDIA_TO_CANVA[item.mediaType]!}
              title={item.label}
              size="sm"
            />
          )}

          {/* コピーボタン */}
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition',
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>
      </div>

      {/* 本文 */}
      <div className="px-4 py-3">
        <pre className={cn(
          'whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed',
        )}>
          {displayContent}
        </pre>

        {/* 展開ボタン */}
        {showToggle && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
          >
            {expanded
              ? <><ChevronUp size={14} /> 折りたたむ</>
              : <><ChevronDown size={14} /> 全文を見る（{lines.length}行）</>
            }
          </button>
        )}
      </div>
    </div>
  );
}
