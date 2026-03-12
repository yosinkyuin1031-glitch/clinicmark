'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';

interface RatingButtonsProps {
  contentId:      string;
  initialRating?: string;  // "good" | "bad" | "none"
  size?:          'sm' | 'md';
  onRatingChange?: (newRating: string) => void;
}

export function RatingButtons({
  contentId,
  initialRating = 'none',
  size = 'sm',
  onRatingChange,
}: RatingButtonsProps) {
  const [rating, setRating]   = useState(initialRating);
  const [loading, setLoading] = useState(false);

  const handleRate = async (value: 'good' | 'bad') => {
    if (loading) return;
    // 同じボタンを押すと「none」に戻す（トグル）
    const newRating = rating === value ? 'none' : value;
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${contentId}/rate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rating: newRating }),
      });
      if (res.ok) {
        setRating(newRating);
        onRatingChange?.(newRating);
      }
    } finally {
      setLoading(false);
    }
  };

  const iconSize  = size === 'sm' ? 13 : 15;
  const btnBase   = cn(
    'flex items-center gap-1 rounded-lg font-medium transition select-none',
    size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5',
    loading && 'opacity-50 cursor-not-allowed',
  );

  return (
    <div className="flex items-center gap-1">
      {/* 👍 高評価 */}
      <button
        onClick={() => handleRate('good')}
        disabled={loading}
        title="良いコンテンツとして保存（次回生成に活用されます）"
        className={cn(
          btnBase,
          rating === 'good'
            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300'
            : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600',
        )}
      >
        <ThumbsUp size={iconSize} />
        {rating === 'good' && <span>良い例</span>}
      </button>

      {/* 👎 低評価 */}
      <button
        onClick={() => handleRate('bad')}
        disabled={loading}
        title="改善が必要なコンテンツとして記録"
        className={cn(
          btnBase,
          rating === 'bad'
            ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
            : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600',
        )}
      >
        <ThumbsDown size={iconSize} />
        {rating === 'bad' && <span>要改善</span>}
      </button>
    </div>
  );
}
