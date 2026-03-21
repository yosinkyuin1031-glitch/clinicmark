'use client';

import { useEffect, useState, useCallback } from 'react';
import { Archive, Filter, Sparkles, CheckSquare, Square, CheckCircle, X, Clock, XCircle } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { ContentCard } from '@/components/library/ContentCard';
import { LearningStatusPanel } from '@/components/library/LearningStatusPanel';
import {
  CONTENT_TYPE_LABELS,
  CONTENT_STATUS_LABELS,
  SCHEDULED_POST_STATUS_LABELS,
  SCHEDULED_POST_STATUS_COLORS,
  type GeneratedContent,
  type ContentStatus,
  type ContentType,
  type ScheduledPost,
} from '@/types';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

type RatingFilter = '' | 'good' | 'bad';

export default function LibraryPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');
  const { toasts, removeToast, success, error: showError } = useToast();

  const [contents, setContents]         = useState<GeneratedContent[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [typeFilter, setTypeFilter]     = useState<ContentType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('');
  const [statsRefreshTick, setStatsRefreshTick] = useState(0);

  // 予約投稿
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);

  // ── 一括操作 ──────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

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
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [currentClinic, typeFilter, statusFilter, ratingFilter]);

  useEffect(() => { fetchContents(); }, [fetchContents]);

  // フィルター変更時は選択解除
  useEffect(() => { setSelected(new Set()); }, [typeFilter, statusFilter, ratingFilter]);

  // 予約投稿を取得
  const fetchScheduledPosts = useCallback(async () => {
    if (!currentClinic) return;
    setScheduledLoading(true);
    try {
      const res  = await fetch(`/api/threads/scheduled?clinicId=${currentClinic.id}`);
      const json = await res.json();
      setScheduledPosts(json.scheduledPosts ?? []);
    } catch { /* silent */ }
    finally { setScheduledLoading(false); }
  }, [currentClinic]);

  useEffect(() => { fetchScheduledPosts(); }, [fetchScheduledPosts]);

  // 予約キャンセル
  async function handleCancelScheduled(id: string) {
    try {
      const res = await fetch(`/api/threads/scheduled/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setScheduledPosts((prev) =>
          prev.map((p) => p.id === id ? { ...p, status: 'CANCELLED' } : p),
        );
        success('予約をキャンセルしました');
      } else {
        const data = await res.json();
        showError(data.error ?? 'キャンセルに失敗しました');
      }
    } catch { showError('キャンセルに失敗しました'); }
  }

  async function handleStatusChange(id: string, status: ContentStatus) {
    try {
      await fetch('/api/content', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, status }),
      });
      setContents((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch { showError('ステータス変更に失敗しました'); }
  }

  function handleRatingChange(id: string, rating: string) {
    setContents((prev) => prev.map((c) => (c.id === id ? { ...c, rating } : c)));
    setStatsRefreshTick((t) => t + 1);
  }

  // ── チェックボックス操作 ──────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === contents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contents.map((c) => c.id)));
    }
  }

  // ── 一括ステータス変更 ────────────────────────────────
  async function handleBulkStatus(status: ContentStatus) {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all(
        [...selected].map((id) =>
          fetch('/api/content', {
            method:  'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ id, status }),
          }),
        ),
      );
      setContents((prev) =>
        prev.map((c) => selected.has(c.id) ? { ...c, status } : c),
      );
      success(`${selected.size}件を「${CONTENT_STATUS_LABELS[status]}」に変更しました`);
      setSelected(new Set());
    } catch { showError('一括変更に失敗しました'); }
    finally { setBulkLoading(false); }
  }

  if (!currentClinic) {
    return <div className="flex items-center justify-center h-64 text-slate-400">院を選択してください</div>;
  }

  const CONTENT_TYPES    = Object.keys(CONTENT_TYPE_LABELS) as ContentType[];
  const CONTENT_STATUSES = Object.keys(CONTENT_STATUS_LABELS) as ContentStatus[];
  const goodCount        = contents.filter((c) => c.rating === 'good').length;
  const allSelected      = contents.length > 0 && selected.size === contents.length;
  const someSelected     = selected.size > 0;

  return (
    <>
    <div className="max-w-4xl mx-auto">
      {/* AI 学習状況ダッシュボード */}
      <LearningStatusPanel clinicId={currentClinic.id} refreshTick={statsRefreshTick} />

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
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white border border-slate-200 rounded-xl">
        <Filter size={15} className="text-slate-400 shrink-0" />

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

      {/* ── 一括操作バー ── */}
      {!loading && contents.length > 0 && (
        <div className={cn(
          'flex items-center gap-3 mb-3 px-4 py-2.5 rounded-xl border transition-all',
          someSelected
            ? cn('border-transparent shadow-sm', color.bg + '/10', 'bg-slate-50 border-slate-200')
            : 'bg-white border-slate-200',
        )}>
          {/* 全選択チェックボックス */}
          <button
            onClick={toggleSelectAll}
            className="text-slate-500 hover:text-slate-800 transition shrink-0"
            title={allSelected ? '全解除' : '全選択'}
          >
            {allSelected
              ? <CheckSquare size={17} className={color.text} />
              : <Square size={17} />
            }
          </button>

          {someSelected ? (
            <>
              <span className="text-sm font-medium text-slate-700">
                {selected.size}件を選択中
              </span>
              <div className="w-px h-4 bg-slate-300" />

              {/* 一括ステータス変更ボタン */}
              <button
                onClick={() => handleBulkStatus('APPROVED')}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition disabled:opacity-50"
              >
                <CheckCircle size={13} />
                承認
              </button>
              <button
                onClick={() => handleBulkStatus('DRAFT')}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition disabled:opacity-50"
              >
                下書きに戻す
              </button>
              <button
                onClick={() => handleBulkStatus('ARCHIVED')}
                disabled={bulkLoading}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition disabled:opacity-50"
              >
                <Archive size={13} />
                アーカイブ
              </button>

              <button
                onClick={() => setSelected(new Set())}
                className="ml-auto text-slate-400 hover:text-slate-600 transition"
                title="選択解除"
              >
                <X size={15} />
              </button>
            </>
          ) : (
            <span className="text-xs text-slate-400">
              チェックボックスで複数選択 → 一括ステータス変更
            </span>
          )}
        </div>
      )}

      {/* ── Threads 予約投稿セクション ── */}
      {scheduledPosts.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Threads 予約投稿</h2>
            <span className="text-xs text-slate-400">
              {scheduledPosts.filter((p) => p.status === 'PENDING').length}件予約中
            </span>
          </div>

          {scheduledLoading ? (
            <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <div className="space-y-2">
              {scheduledPosts.map((post) => {
                const d = new Date(post.scheduledAt);
                const dateLabel = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3.5 bg-white border border-slate-200 rounded-xl"
                  >
                    {/* Threads アイコン */}
                    <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <svg viewBox="0 0 192 192" width="14" height="14" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.347-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.452-15.153 9.879-25.93 5.943 3.578 10.337 8.3 12.767 13.896 4.134 9.467 4.373 25.006-8.546 37.932-11.319 11.325-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.741C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 9.986 15.846 12.8 26.21l16.147-4.317c-3.39-12.583-8.879-23.565-16.44-32.708C147.036 10.812 125.205 1.27 97.07 1.08h-.113C68.882 1.27 47.292 10.83 32.788 28.352 19.882 43.716 13.233 65.131 13.024 96v.065c.209 30.869 6.859 52.284 19.764 67.648 14.504 17.52 36.094 27.081 64.168 27.269h.108c24.922-.163 42.5-6.727 57.037-21.269 19.139-19.136 18.557-42.91 12.246-57.501-4.484-10.254-13.033-18.533-24.81-23.224Zm-43.16 40.947c-10.44.588-21.286-4.098-21.82-14.135-.397-7.442 5.296-15.746 22.461-16.735 1.966-.113 3.895-.169 5.79-.169 6.235 0 12.068.606 17.37 1.765-1.978 24.702-13.754 28.713-23.8 29.274Z"/>
                      </svg>
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                        <Clock size={11} />
                        {dateLabel}
                        <span className={cn(
                          'ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium',
                          SCHEDULED_POST_STATUS_COLORS[post.status as keyof typeof SCHEDULED_POST_STATUS_COLORS] ?? 'bg-slate-100 text-slate-500',
                        )}>
                          {SCHEDULED_POST_STATUS_LABELS[post.status as keyof typeof SCHEDULED_POST_STATUS_LABELS] ?? post.status}
                        </span>
                      </p>
                      <p className="text-sm text-slate-700 line-clamp-2">{post.content}</p>
                      {post.errorMessage && (
                        <p className="text-xs text-red-500 mt-1">{post.errorMessage}</p>
                      )}
                    </div>

                    {/* キャンセルボタン */}
                    {post.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelScheduled(post.id)}
                        title="予約キャンセル"
                        className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
            <div key={content.id} className="flex items-start gap-2">
              {/* 選択チェックボックス */}
              <button
                onClick={() => toggleSelect(content.id)}
                className="mt-3.5 text-slate-300 hover:text-slate-500 transition shrink-0"
              >
                {selected.has(content.id)
                  ? <CheckSquare size={17} className={color.text} />
                  : <Square size={17} />
                }
              </button>

              <div className="flex-1 min-w-0">
                <ContentCard
                  content={content}
                  clinicId={currentClinic.id}
                  onStatusChange={handleStatusChange}
                  onRatingChange={handleRatingChange}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
