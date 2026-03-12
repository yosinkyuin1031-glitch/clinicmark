'use client';

import { useState } from 'react';
import { FileImage, Check, ChevronDown, ChevronUp, Trash2, ExternalLink } from 'lucide-react';
import type { Flyer } from '@/types';
import { FLYER_TYPE_LABELS } from '@/types';
import { cn, formatDate } from '@/lib/utils/clinic';

const STATUS_STYLES: Record<string, string> = {
  DRAFT:    'bg-slate-100 text-slate-600',
  APPROVED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT:    '下書き',
  APPROVED: '確認済み',
  ARCHIVED: 'アーカイブ',
};

interface Props {
  flyer:          Flyer;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete:       (id: string) => Promise<void>;
  onSelect:       (flyer: Flyer) => void;
}

export function FlyerCard({ flyer, onStatusChange, onDelete, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copying,  setCopying]  = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  async function handleCopy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopying(key);
    setTimeout(() => setCopying(null), 1800);
  }

  async function handleStatus(status: string) {
    setLoading(true);
    await onStatusChange(flyer.id, status);
    setLoading(false);
  }

  const isPdf = flyer.fileUrl.endsWith('.pdf');

  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl overflow-hidden', loading && 'opacity-60')}>
      {/* ヘッダー */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* ファイルプレビュー or アイコン */}
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
          {flyer.fileUrl && !isPdf ? (
            <img src={flyer.fileUrl} alt={flyer.title} className="w-full h-full object-cover" />
          ) : (
            <FileImage size={18} className="text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{flyer.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {FLYER_TYPE_LABELS[flyer.flyerType] ?? flyer.flyerType} · {formatDate(flyer.createdAt)}
          </p>
        </div>

        {/* ステータス */}
        <select
          value={flyer.status}
          onChange={(e) => handleStatus(e.target.value)}
          className={cn(
            'text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none',
            STATUS_STYLES[flyer.status] ?? STATUS_STYLES.DRAFT,
          )}
        >
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {/* 編集ボタン */}
        <button
          onClick={() => onSelect(flyer)}
          className="p-1.5 text-xs text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
          title="編集"
        >
          編集
        </button>

        {/* ファイルリンク */}
        {flyer.fileUrl && (
          <a
            href={flyer.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
            title="ファイルを開く"
          >
            <ExternalLink size={14} />
          </a>
        )}

        {/* 展開ボタン */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* 削除 */}
        <button
          onClick={() => onDelete(flyer.id)}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="削除"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* キャッチコピー（常に表示）*/}
      {flyer.catchCopy && (
        <div className="px-4 pb-2">
          <p className="text-xs text-slate-500 italic">「{flyer.catchCopy}」</p>
        </div>
      )}

      {/* 展開コンテンツ */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50">
          {[
            { key: 'catchCopy',   label: 'キャッチコピー', value: flyer.catchCopy },
            { key: 'bodyText',    label: '本文（表面）',   value: flyer.bodyText },
            { key: 'backText',    label: '裏面テキスト',   value: flyer.backText },
            { key: 'ctaText',     label: 'CTA',           value: flyer.ctaText },
            { key: 'designNotes', label: 'デザインメモ',   value: flyer.designNotes },
          ].filter((f) => f.value).map(({ key, label, value }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-400">{label}</span>
                <button
                  onClick={() => handleCopy(value, key)}
                  className={cn(
                    'flex items-center gap-1 text-xs px-2 py-0.5 rounded transition',
                    copying === key
                      ? 'text-green-600 bg-green-50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-white',
                  )}
                >
                  {copying === key ? <><Check size={11} /> コピー済み</> : 'コピー'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                {value}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
