'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import { RatingButtons } from '@/components/library/RatingButtons';
import { CanvaButton } from '@/components/ui/CanvaButton';

interface Props {
  output: string;
  contentId?: string;
  inputTokens?: number;
  outputTokens?: number;
  durationMs?: number;
  canvaDesignType?: string;  // 'instagram_post' | 'your_story' | 'flyer' | 'facebook_post' | etc.
}

export function OutputPreview({ output, contentId, inputTokens, outputTokens, durationMs, canvaDesignType }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {durationMs && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {(durationMs / 1000).toFixed(1)}秒
            </span>
          )}
          {inputTokens && outputTokens && (
            <span className="flex items-center gap-1">
              <Zap size={12} /> {inputTokens + outputTokens} tokens
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {contentId && (
            <>
              <RatingButtons contentId={contentId} initialRating="none" size="sm" />
              <a
                href={`/library/${contentId}`}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition"
              >
                <ExternalLink size={12} /> ライブラリ
              </a>
            </>
          )}
          {canvaDesignType && (
            <CanvaButton content={output} designType={canvaDesignType} size="sm" />
          )}
          <button
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition',
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50',
            )}
          >
            {copied ? <><Check size={12} /> コピー済み</> : <><Copy size={12} /> コピー</>}
          </button>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-4 bg-white">
        <pre className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-sans">
          {output}
        </pre>
      </div>
    </div>
  );
}
