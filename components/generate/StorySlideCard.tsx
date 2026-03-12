'use client';

import { useState } from 'react';
import { Copy, Check, Hash, Image, AlignLeft, Type } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import type { StorySlide } from '@/types';

interface Props {
  slide:     StorySlide;
  accentBg:  string;   // 院カラー bg クラス
  accentText:string;   // 院カラー text クラス
}

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition',
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
        className,
      )}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  );
}

// 全スライド内容を1テキストに結合してコピー
function buildFullText(slide: StorySlide): string {
  const lines: string[] = [
    `【P${slide.page} 上段】${slide.upperText}`,
    '',
    `【P${slide.page} 画像指示】${slide.imageInstruction}`,
    '',
    `【P${slide.page} 下段】${slide.lowerText}`,
    '',
    `【P${slide.page} タイトル候補】`,
    ...slide.titleCandidates.map((t, i) => `${i + 1}. ${t}`),
  ];
  if (slide.ctaText) {
    lines.push('', `【CTA】${slide.ctaText}`);
  }
  if (slide.hashtags.length > 0) {
    lines.push('', `【ハッシュタグ】`, slide.hashtags.join(' '));
  }
  return lines.join('\n');
}

export function StorySlideCard({ slide, accentBg, accentText }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* ヘッダー */}
      <div className={cn('flex items-center justify-between px-4 py-3', accentBg)}>
        <span className="text-white text-sm font-bold">
          Page {slide.page}
        </span>
        <CopyButton text={buildFullText(slide)} className="!bg-white/20 !text-white hover:!bg-white/30" />
      </div>

      <div className="p-4 space-y-4">
        {/* 上段テキスト */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Type size={12} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">上段テキスト</span>
          </div>
          <p className="text-sm font-bold text-slate-900 leading-relaxed">{slide.upperText}</p>
        </div>

        {/* 画像指示 */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Image size={12} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">画像指示文</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            {slide.imageInstruction}
          </p>
        </div>

        {/* 下段リード文 */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlignLeft size={12} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">下段リード文</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{slide.lowerText}</p>
        </div>

        {/* タイトル候補 */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">タイトル候補</p>
          <div className="space-y-1.5">
            {slide.titleCandidates.map((t, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={cn('text-xs font-bold shrink-0 mt-0.5', accentText)}>
                  {i + 1}.
                </span>
                <p className="text-sm text-slate-700 flex-1">{t}</p>
                <CopyButton text={t} />
              </div>
            ))}
          </div>
        </div>

        {/* CTA（最終スライドのみ） */}
        {slide.ctaText && (
          <div className={cn('rounded-lg px-3 py-2 border', accentBg.replace('bg-', 'bg-').replace('-600', '-50').replace('-500', '-50'), 'border-slate-200')}>
            <p className="text-xs font-semibold text-slate-500 mb-1">CTA テキスト</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-800">{slide.ctaText}</p>
              <CopyButton text={slide.ctaText} />
            </div>
          </div>
        )}

        {/* ハッシュタグ（最終スライドのみ） */}
        {slide.hashtags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Hash size={12} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">
                  ハッシュタグ（{slide.hashtags.length}個）
                </span>
              </div>
              <CopyButton text={slide.hashtags.join(' ')} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {slide.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
