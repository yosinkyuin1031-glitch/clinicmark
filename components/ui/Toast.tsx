'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id:      string;
  type:    ToastType;
  message: string;
}

interface Props {
  toasts:   ToastMessage[];
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // マウント後にアニメーション開始
    const t1 = setTimeout(() => setVisible(true), 10);
    // 4秒後に自動消去
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [toast.id, onRemove]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border max-w-sm w-full transition-all duration-300',
        toast.type === 'success'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-red-50 border-red-200 text-red-800',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
      )}
    >
      {toast.type === 'success'
        ? <CheckCircle2 size={16} className="text-green-600 shrink-0 mt-0.5" />
        : <AlertCircle  size={16} className="text-red-600 shrink-0 mt-0.5" />
      }
      <p className="text-sm flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(toast.id), 300); }}
        className="shrink-0 text-current opacity-50 hover:opacity-80 transition"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
