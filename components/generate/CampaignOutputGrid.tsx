'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import type { CampaignOutput } from '@/types';

interface Props {
  outputs:    CampaignOutput[];
  accentBg:   string;
  accentText: string;
}

function CopyButton({ text, size = 'sm', className }: { text: string; size?: 'sm' | 'xs'; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className={cn(
        'flex items-center gap-1 rounded-md transition shrink-0',
        size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1',
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
        className,
      )}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  );
}

// フィールド1件
function Field({
  label, value, mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <CopyButton text={value} size="xs" />
      </div>
      <p className={cn(
        'text-sm text-slate-800 leading-relaxed whitespace-pre-wrap',
        mono && 'font-mono text-xs bg-slate-50 rounded p-2 border border-slate-100',
      )}>
        {value}
      </p>
    </div>
  );
}

// 訴求軸カード
function AxisCard({
  output, accentBg, accentText,
}: {
  output: CampaignOutput;
  accentBg: string;
  accentText: string;
}) {
  const [expanded, setExpanded] = useState(false);

  // 全コンテンツを1テキストにまとめる
  const fullText = [
    `【${output.appealLabel}】`,
    `■ ヘッドライン\n${output.headline}`,
    `■ メインテキスト\n${output.mainText}`,
    `■ ディスクリプション\n${output.description}`,
    ...(output.videoOutline ? [`■ 動画アウトライン\n${output.videoOutline}`] : []),
    ...(output.lpHero       ? [`■ LP ファーストビュー\n${output.lpHero}`]   : []),
    ...(output.lpSubcopy    ? [`■ LP サブコピー\n${output.lpSubcopy}`]      : []),
    `■ CTA 案\n${output.ctaOptions.map((c, i) => `${i + 1}. ${c}`).join('\n')}`,
  ].join('\n\n');

  const hasOptional = !!(output.videoOutline || output.lpHero);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* カードヘッダー */}
      <div className={cn('flex items-center justify-between px-4 py-3', accentBg)}>
        <span className="text-white text-sm font-bold">{output.appealLabel}</span>
        <CopyButton text={fullText} className="!bg-white/20 !text-white hover:!bg-white/30" />
      </div>

      <div className="p-4 space-y-4">
        {/* ヘッドライン */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-500">ヘッドライン</span>
            <CopyButton text={output.headline} size="xs" />
          </div>
          <p className="text-base font-bold text-slate-900">{output.headline}</p>
        </div>

        {/* メインテキスト */}
        <Field label="メインテキスト" value={output.mainText} />

        {/* ディスクリプション */}
        <Field label="ディスクリプション" value={output.description} />

        {/* 任意フィールド（折りたたみ） */}
        {hasOptional && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
            >
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {expanded ? '詳細を閉じる' : '動画・LP コピーを表示'}
            </button>
            {expanded && (
              <div className="mt-3 space-y-4 border-t border-slate-100 pt-3">
                {output.videoOutline && (
                  <Field label="動画アウトライン" value={output.videoOutline} mono />
                )}
                {output.lpHero && (
                  <Field label="LP ファーストビュー" value={output.lpHero} />
                )}
                {output.lpSubcopy && (
                  <Field label="LP サブコピー" value={output.lpSubcopy} />
                )}
              </div>
            )}
          </div>
        )}

        {/* CTA 案 */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">CTA 案</p>
          <div className="space-y-1.5">
            {output.ctaOptions.map((cta, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={cn('text-xs font-bold shrink-0', accentText)}>{i + 1}.</span>
                <p className="text-sm text-slate-700 flex-1">{cta}</p>
                <CopyButton text={cta} size="xs" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CampaignOutputGrid({ outputs, accentBg, accentText }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {outputs.map((output) => (
        <AxisCard
          key={output.appealAxis}
          output={output}
          accentBg={accentBg}
          accentText={accentText}
        />
      ))}
    </div>
  );
}
