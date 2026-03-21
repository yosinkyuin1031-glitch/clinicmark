'use client';

import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';

interface Props {
  open:        boolean;
  title:       string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?:  string;
  danger?:      boolean;
  onConfirm:   () => void;
  onCancel:    () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '削除する',
  cancelLabel  = 'キャンセル',
  danger       = true,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-start gap-3">
            {danger && (
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800">{title}</p>
              {description && (
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ボタン */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition',
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-900',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
