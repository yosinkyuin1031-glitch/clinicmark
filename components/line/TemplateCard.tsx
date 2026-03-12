'use client';

import { useState } from 'react';
import { Check, Copy, ChevronDown, ChevronUp, Trash2, RefreshCw } from 'lucide-react';
import type { LineTemplate } from '@/types';
import { LINE_CATEGORY_LABELS } from '@/types';
import { cn, formatDate } from '@/lib/utils/clinic';

const CATEGORY_COLORS: Record<string, string> = {
  greeting:     'bg-blue-100 text-blue-700',
  reminder:     'bg-amber-100 text-amber-700',
  follow_up:    'bg-emerald-100 text-emerald-700',
  reactivation: 'bg-purple-100 text-purple-700',
  promotion:    'bg-rose-100 text-rose-700',
  custom:       'bg-slate-100 text-slate-600',
};

interface Props {
  template:    LineTemplate;
  onDelete:    (id: string) => Promise<void>;
  onEdit:      (t: LineTemplate) => void;
  onRegenerate:(t: LineTemplate) => void;
}

export function TemplateCard({ template, onDelete, onEdit, onRegenerate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(template.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const categoryLabel = LINE_CATEGORY_LABELS[template.category] ?? template.category;
  const categoryColor = CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.custom;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 py-3 flex items-center gap-3">
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', categoryColor)}>
          {categoryLabel}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{template.title}</p>
          <p className="text-xs text-slate-400">{formatDate(template.createdAt)}</p>
        </div>

        {/* コピー */}
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition',
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600',
          )}
          title="メッセージをコピー"
        >
          {copied ? <><Check size={12} /> コピー済み</> : <><Copy size={12} /> コピー</>}
        </button>

        {/* 再生成 */}
        <button
          onClick={() => onRegenerate(template)}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="AI再生成"
        >
          <RefreshCw size={14} />
        </button>

        {/* 編集 */}
        <button
          onClick={() => onEdit(template)}
          className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition"
        >
          編集
        </button>

        {/* 展開 */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* 削除 */}
        <button
          onClick={() => onDelete(template.id)}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* プレビュー（折り畳み） */}
      {!expanded && (
        <div className="px-4 pb-3">
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 whitespace-pre-line">
            {template.message}
          </p>
        </div>
      )}

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
          {/* メッセージ本文 */}
          <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
            {template.message}
          </pre>

          {/* クイックリプライ */}
          {template.quickReplies.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 mb-1.5">クイックリプライ</p>
              <div className="flex flex-wrap gap-1.5">
                {template.quickReplies.map((qr, i) => (
                  <span key={i} className="text-xs bg-white border border-slate-200 rounded-full px-2.5 py-1 text-slate-600">
                    {qr.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
