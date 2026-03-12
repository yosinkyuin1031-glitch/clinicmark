'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, FileText, Instagram } from 'lucide-react';
import {
  CONTENT_TYPE_LABELS,
  CONTENT_STATUS_LABELS,
  type GeneratedContent,
  type ContentStatus,
  type ContentType,
} from '@/types';
import { cn, formatDate, truncate } from '@/lib/utils/clinic';
import { RatingButtons } from '@/components/library/RatingButtons';

const TYPE_ICONS: Partial<Record<ContentType, React.ElementType>> = {
  FAQ:             FileText,
  INSTAGRAM_POST:  Instagram,
  INSTAGRAM_STORY: Instagram,
};

const STATUS_STYLES: Record<ContentStatus, string> = {
  DRAFT:    'bg-slate-100 text-slate-600',
  APPROVED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

interface Props {
  content: GeneratedContent;
  onStatusChange: (id: string, status: ContentStatus) => Promise<void>;
  onRatingChange?: (id: string, rating: string) => void;
}

export function ContentCard({ content, onStatusChange, onRatingChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied]     = useState(false);
  const [loading, setLoading]   = useState(false);

  // type が ContentType に含まれない場合（MediaType 文字列）は FileText を使用
  const Icon = TYPE_ICONS[content.type as ContentType] ?? FileText;
  // タイプラベル：既知の ContentType なら翻訳、未知なら raw string をそのまま表示
  const typeLabel = CONTENT_TYPE_LABELS[content.type as ContentType] ?? content.type;

  async function handleCopy() {
    await navigator.clipboard.writeText(content.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStatusChange(status: ContentStatus) {
    setLoading(true);
    await onStatusChange(content.id, status);
    setLoading(false);
  }

  return (
    <div className={cn(
      'bg-white border border-slate-200 rounded-xl overflow-hidden transition',
      loading && 'opacity-60',
    )}>
      {/* カードヘッダー */}
      <div className="px-4 py-3 flex items-center gap-3">
        <Icon size={16} className="text-slate-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{content.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {typeLabel} · {formatDate(content.createdAt)}
          </p>
        </div>

        {/* 評価ボタン */}
        <RatingButtons
          contentId={content.id}
          initialRating={content.rating ?? 'none'}
          size="sm"
          onRatingChange={(rating) => onRatingChange?.(content.id, rating)}
        />

        {/* ステータスバッジ */}
        <select
          value={content.status}
          onChange={(e) => handleStatusChange(e.target.value as ContentStatus)}
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500',
            STATUS_STYLES[content.status as ContentStatus] ?? STATUS_STYLES.DRAFT,
          )}
        >
          {(Object.keys(CONTENT_STATUS_LABELS) as ContentStatus[]).map((s) => (
            <option key={s} value={s}>{CONTENT_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <button
          onClick={handleCopy}
          className={cn(
            'p-1.5 rounded-lg text-xs transition',
            copied
              ? 'text-green-600 bg-green-50'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
          )}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* プレビュー（折りたたみ） */}
      {!expanded && (
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            {truncate(content.output, 150)}
          </p>
        </div>
      )}

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
          <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
            {content.output}
          </pre>
        </div>
      )}
    </div>
  );
}
