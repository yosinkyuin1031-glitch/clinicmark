'use client';

import { useEffect, useState, useCallback } from 'react';
import { Archive, Filter, Sparkles } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { ContentCard } from '@/components/library/ContentCard';
import { LearningStatusPanel } from '@/components/library/LearningStatusPanel';
import {
  CONTENT_TYPE_LABELS,
  CONTENT_STATUS_LABELS,
  type GeneratedContent,
  type ContentStatus,
  type ContentType,
} from '@/types';
import { getClinicColor, cn } from '@/lib/utils/clinic';

type RatingFilter = '' | 'good' | 'bad';

export default function LibraryPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [contents, setContents]         = useState<GeneratedContent[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [typeFilter, setTypeFilter]     = useState<ContentType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('');
  // RatingButtons が評価を変更したらダッシュボードを再フェッチするためのカウンタ
  const [statsRefreshTick, setStatsRefreshTick] = useState(0);

  const fetchContents = useCallback(async () => {
    if (!currentClinic) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ clinicId: currentClinic.id });
      if (typeFilter)   params.set('type',   typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (ratingFilter) params.set('rating', ratingFilter);

      const res  = await fetch(`/api/content?${params}`);
      const json = await res.json();
      setContents(json.data ?? []);
      setTotal(json.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [currentClinic, typeFilter, statusFilter, ratingFilter]);

  useEffect(() => { fetchContents(); }, [fetchContents]);

  async function handleStatusChange(id: string, status: ContentStatus) {
    await fetch('/api/content', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, status }),
    });
    setContents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c)),
    );
  }

  // 評価変更時にコンテンツリストのratingを更新 & 統計パネルを再フェッチ
  function handleRatingChange(id: string, rating: string) {
    setContents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rating } : c)),
    );
    setStatsRefreshTick((t) => t + 1);
  }

  if (!currentClinic) {
    return <div className="flex items-center justify-center h-64 text-slate-400">院を選択してください</div>;
  }

  const CONTENT_TYPES    = Object.keys(CONTENT_TYPE_LABELS) as ContentType[];
  const CONTENT_STATUSES = Object.keys(CONTENT_STATUS_LABELS) as ContentStatus[];

  // 高評価コンテンツ数（バッジ表示用）
  const goodCount = contents.filter((c) => c.rating === 'good').length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* AI 学習状況ダッシュボード */}
      <LearningStatusPanel
        clinicId={currentClinic.id}
        refreshTick={statsRefreshTick}
      />

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
            <Archive size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">コンテンツライブラリ</h1>
            <p className="text-sm text-slate-500">
              全{total}件 · {currentClinic.name}
              {goodCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 font-medium">
                  <Sparkles size={11} />
                  高評価 {goodCount}件
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-white border border-slate-200 rounded-xl">
        <Filter size={15} className="text-slate-400 shrink-0" />

        {/* 種類フィルター */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ContentType | '')}
          className="text-sm border-0 text-slate-700 focus:outline-none focus:ring-0 bg-transparent cursor-pointer"
        >
          <option value="">すべての種類</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>
          ))}
        </select>

        <div className="w-px h-4 bg-slate-200" />

        {/* ステータスフィルター */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContentStatus | '')}
          className="text-sm border-0 text-slate-700 focus:outline-none focus:ring-0 bg-transparent cursor-pointer"
        >
          <option value="">すべてのステータス</option>
          {CONTENT_STATUSES.map((s) => (
            <option key={s} value={s}>{CONTENT_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <div className="w-px h-4 bg-slate-200" />

        {/* 評価フィルター */}
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value as RatingFilter)}
          className="text-sm border-0 text-slate-700 focus:outline-none focus:ring-0 bg-transparent cursor-pointer"
        >
          <option value="">すべての評価</option>
          <option value="good">👍 高評価（良い例）</option>
          <option value="bad">👎 要改善</option>
        </select>
      </div>

      {/* コンテンツ一覧 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Archive size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">コンテンツがまだありません</p>
          <p className="text-xs mt-1">一括生成やInstagram台本生成からコンテンツを作成しましょう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onStatusChange={handleStatusChange}
              onRatingChange={handleRatingChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
