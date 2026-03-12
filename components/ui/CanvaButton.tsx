'use client';

import { useState } from 'react';
import { Palette, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';

interface CanvaButtonProps {
  content:    string;          // 生成されたテキスト（クリップボードにコピー）
  designType: string;          // 'instagram_post' | 'your_story' | 'flyer' | etc.
  title?:     string;          // Canvaデザインのタイトル
  size?:      'sm' | 'md';
  className?: string;
}

type State = 'idle' | 'loading' | 'done';

export function CanvaButton({
  content,
  designType,
  title = 'ClinicMark コンテンツ',
  size = 'sm',
  className,
}: CanvaButtonProps) {
  const [state, setState] = useState<State>('idle');

  const handleClick = async () => {
    if (state === 'loading') return;
    setState('loading');

    try {
      // 1. テキストをクリップボードにコピー
      await navigator.clipboard.writeText(content);

      // 2. Canva API / フォールバックURL を取得
      const res = await fetch('/api/canva/design', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ designType, title }),
      });

      if (res.ok) {
        const { editUrl } = await res.json();
        // 3. Canva を新しいタブで開く
        window.open(editUrl, '_blank', 'noopener');
      }

      setState('done');
      setTimeout(() => setState('idle'), 3000);
    } catch {
      setState('idle');
    }
  };

  const isSm = size === 'sm';

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      title={
        state === 'done'
          ? 'テキストをコピーしました。Canvaに貼り付けてご利用ください'
          : 'テキストをコピーしてCanvaでデザイン作成'
      }
      className={cn(
        'flex items-center gap-1 rounded-lg font-medium transition select-none',
        isSm ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5',
        state === 'done'
          ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300'
          : 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100',
        state === 'loading' && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {state === 'loading' ? (
        <Loader2 size={isSm ? 12 : 14} className="animate-spin" />
      ) : state === 'done' ? (
        <Check size={isSm ? 12 : 14} />
      ) : (
        <Palette size={isSm ? 12 : 14} />
      )}
      {state === 'done' ? 'Canvaで開く' : 'Canvaで作成'}
    </button>
  );
}
