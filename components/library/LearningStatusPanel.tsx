'use client';

import { useEffect, useState, useCallback } from 'react';
import { Brain, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { MEDIA_GROUPS, MEDIA_LABELS, type MediaType } from '@/types';
import { cn } from '@/lib/utils/clinic';

interface Stats {
  goodByType: Record<string, number>;
  badByType:  Record<string, number>;
  totalGood:  number;
  totalBad:   number;
}

interface Props {
  clinicId: string;
  /** 外部から再フェッチをトリガーするためのバージョン番号 */
  refreshTick?: number;
}

// 学習進捗レベル
function getLearningLevel(goodCount: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (goodCount === 0)  return { label: '未蓄積', color: 'text-slate-400',  bg: 'bg-slate-100' };
  if (goodCount === 1)  return { label: '学習中', color: 'text-amber-600',  bg: 'bg-amber-50'  };
  if (goodCount <= 3)   return { label: '蓄積中', color: 'text-blue-600',   bg: 'bg-blue-50'   };
  return               { label: '学習済', color: 'text-emerald-600', bg: 'bg-emerald-50' };
}

export function LearningStatusPanel({ clinicId, refreshTick }: Props) {
  const [stats,     setStats]     = useState<Stats | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/content/stats?clinicId=${clinicId}`);
      const json = await res.json();
      setStats(json);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => { fetchStats(); }, [fetchStats, refreshTick]);

  if (loading && !stats) {
    return (
      <div className="h-16 bg-slate-100 rounded-xl animate-pulse mb-5" />
    );
  }

  if (!stats) return null;

  const { goodByType, badByType, totalGood, totalBad } = stats;

  return (
    <div className="mb-5 bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* パネルヘッダー */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
      >
        <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
          <Brain size={14} className="text-violet-600" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-sm font-semibold text-slate-800">AI 学習状況</span>
          <span className="ml-2 text-xs text-slate-500">
            {totalGood > 0
              ? `高評価 ${totalGood}件 が次回生成に反映されます`
              : '高評価（👍）をつけると次回の生成精度が上がります'}
          </span>
        </div>

        {/* サマリーバッジ */}
        <div className="flex items-center gap-2 shrink-0">
          {totalGood > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <ThumbsUp size={10} />
              {totalGood}
            </span>
          )}
          {totalBad > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              <ThumbsDown size={10} />
              {totalBad}
            </span>
          )}
          {collapsed ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronUp size={15} className="text-slate-400" />}
        </div>
      </button>

      {/* 詳細グリッド */}
      {!collapsed && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-4">
          {/* 全体進捗バー */}
          {totalGood > 0 && (
            <div className="flex items-center gap-3">
              <Sparkles size={13} className="text-emerald-500 shrink-0" />
              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((totalGood / (MEDIA_GROUPS.flatMap(g => g.types).length * 3)) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {totalGood} / {MEDIA_GROUPS.flatMap(g => g.types).length * 3} 目標
              </span>
            </div>
          )}

          {/* グループ別タイプ一覧 */}
          {MEDIA_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.types.map((mediaType) => {
                  const good = goodByType[mediaType] ?? 0;
                  const bad  = badByType[mediaType]  ?? 0;
                  const level = getLearningLevel(good);

                  return (
                    <div
                      key={mediaType}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs',
                        good > 0
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-slate-200 bg-slate-50',
                      )}
                    >
                      <span className={cn('font-medium', good > 0 ? 'text-slate-700' : 'text-slate-400')}>
                        {MEDIA_LABELS[mediaType as MediaType]}
                      </span>
                      {good > 0 ? (
                        <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                          <ThumbsUp size={9} />
                          {good}
                        </span>
                      ) : (
                        <span className={cn('text-[10px] font-medium px-1 py-0.5 rounded', level.bg, level.color)}>
                          {level.label}
                        </span>
                      )}
                      {bad > 0 && (
                        <span className="flex items-center gap-0.5 text-slate-400">
                          <ThumbsDown size={9} />
                          {bad}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ヒントメッセージ */}
          {totalGood === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">
              一括生成またはライブラリのコンテンツに 👍 をつけると、同じ種類の次回生成に自動的に反映されます
            </p>
          )}
        </div>
      )}
    </div>
  );
}
