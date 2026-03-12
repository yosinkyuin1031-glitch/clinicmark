'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import type { BrandEntry } from '@/types';
import { cn } from '@/lib/utils/clinic';

interface Props {
  entry: BrandEntry;
  onUpdate: (id: string, key: string, value: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DictionaryCard({ entry, onUpdate, onDelete }: Props) {
  const [editing, setEditing]   = useState(false);
  const [key, setKey]           = useState(entry.key);
  const [value, setValue]       = useState(entry.value);
  const [loading, setLoading]   = useState(false);

  async function handleSave() {
    setLoading(true);
    await onUpdate(entry.id, key, value);
    setLoading(false);
    setEditing(false);
  }

  function handleCancel() {
    setKey(entry.key);
    setValue(entry.value);
    setEditing(false);
  }

  async function handleDelete() {
    if (!confirm(`「${entry.key}」を削除しますか？`)) return;
    setLoading(true);
    await onDelete(entry.id);
    setLoading(false);
  }

  if (editing) {
    return (
      <div className="bg-white border-2 border-blue-400 rounded-xl p-4 space-y-3 shadow-sm">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="項目名"
          className="w-full px-3 py-1.5 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          placeholder="内容"
          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Check size={14} /> 保存
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition"
          >
            <X size={14} /> キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-white border border-slate-200 rounded-xl p-4 group hover:shadow-sm transition',
      loading && 'opacity-50 pointer-events-none',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 mb-1">{entry.key}</p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{entry.value}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
