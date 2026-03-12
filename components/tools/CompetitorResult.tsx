'use client';

import { useState } from 'react';
import {
  TrendingUp, TrendingDown, Target, Users, Lightbulb, FileX, ArrowRight, Copy, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import type { CompetitorAnalysis } from '@/types';

interface Props {
  analysis:   CompetitorAnalysis;
  accentBg:   string;
  accentText: string;
  durationMs?: number;
}

function CopyButton({ text }: { text: string }) {
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
        'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition shrink-0',
        copied ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
      )}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  );
}

// リスト形式のセクション
function ListSection({
  icon: Icon, label, items, color = 'slate',
}: {
  icon: React.ElementType;
  label: string;
  items: string[];
  color?: 'green' | 'red' | 'blue' | 'amber' | 'slate' | 'violet';
}) {
  const colorMap = {
    green:  { bg: 'bg-green-50',  border: 'border-green-100', icon: 'text-green-600',  badge: 'bg-green-100 text-green-700'  },
    red:    { bg: 'bg-red-50',    border: 'border-red-100',   icon: 'text-red-600',    badge: 'bg-red-100 text-red-700'      },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',  icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700'    },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-100', icon: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700'  },
    slate:  { bg: 'bg-slate-50',  border: 'border-slate-100', icon: 'text-slate-600',  badge: 'bg-slate-100 text-slate-700'  },
    violet: { bg: 'bg-violet-50', border: 'border-violet-100',icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  };
  const c = colorMap[color];

  return (
    <div className={cn('rounded-xl border p-4', c.bg, c.border)}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className={c.icon} />
        <span className="text-xs font-bold text-slate-600">{label}</span>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className={cn('text-xs font-bold shrink-0 mt-0.5 px-1.5 py-0.5 rounded', c.badge)}>
              {i + 1}
            </span>
            <span className="flex-1 leading-relaxed">{item}</span>
            <CopyButton text={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

// テキストセクション
function TextSection({
  icon: Icon, label, value, iconColor,
}: {
  icon: React.ElementType; label: string; value: string; iconColor: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={iconColor} />
          <span className="text-xs font-bold text-slate-600">{label}</span>
        </div>
        <CopyButton text={value} />
      </div>
      <p className="text-sm text-slate-700 leading-relaxed">{value}</p>
    </div>
  );
}

export function CompetitorResult({ analysis, accentBg, durationMs }: Props) {
  // 全文テキスト生成（一括コピー用）
  const fullText = [
    `■ 競合の強み\n${analysis.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    `\n■ 弱み・改善余地\n${analysis.weaknesses.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    `\n■ 訴求の特徴\n${analysis.appealFeatures}`,
    `\n■ 推定ターゲット\n${analysis.estimatedTarget}`,
    `\n■ 自院が勝てるポイント\n${analysis.winningPoints.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    `\n■ 競合に不足しているコンテンツ\n${analysis.missingContent.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    `\n■ 次のアクション\n${analysis.nextActions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
  ].join('\n');

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-1">
        <p className="text-sm text-slate-600 flex-1">
          <span className="font-bold text-slate-900">競合分析</span> が完了しました
          {durationMs != null && (
            <span className="text-xs text-slate-400 ml-2">{(durationMs / 1000).toFixed(1)}秒</span>
          )}
        </p>
        <button
          onClick={() => navigator.clipboard.writeText(fullText)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium"
        >
          <Copy size={12} />
          全文コピー
        </button>
      </div>

      {/* 強み・弱み */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListSection icon={TrendingUp}   label="競合の強み"        items={analysis.strengths}  color="red"   />
        <ListSection icon={TrendingDown} label="弱み・改善余地"    items={analysis.weaknesses} color="green" />
      </div>

      {/* 訴求の特徴・推定ターゲット */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextSection icon={Target} label="訴求の特徴まとめ" value={analysis.appealFeatures}  iconColor="text-violet-600" />
        <TextSection icon={Users}  label="推定ターゲット像" value={analysis.estimatedTarget} iconColor="text-blue-600"   />
      </div>

      {/* 自院が勝てるポイント */}
      <ListSection icon={Lightbulb}  label="自院が勝てるポイント"              items={analysis.winningPoints}  color="blue"   />

      {/* 競合に不足しているコンテンツ */}
      <ListSection icon={FileX}      label="競合に不足しているコンテンツ"      items={analysis.missingContent} color="amber"  />

      {/* 次のアクション */}
      <ListSection icon={ArrowRight} label="次のアクション提案（自院向け）"    items={analysis.nextActions}    color="violet" />
    </div>
  );
}
