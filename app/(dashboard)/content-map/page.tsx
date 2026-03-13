'use client';

import { useState, useEffect, useCallback } from 'react';
import { Map, Plus, LayoutGrid, Table2, Loader2 } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import {
  MAP_CONTENT_TYPES,
  MAP_CONTENT_TYPE_LABELS,
  MAP_STATUS_LABELS,
  type ContentMapItem,
  type ContentMapInput,
  type MapContentType,
  type MapStatus,
} from '@/types';
import { ContentMapTable }  from '@/components/content-map/ContentMapTable';
import { ContentMapFilter } from '@/components/content-map/ContentMapFilter';
import { DuplicateAlert }   from '@/components/content-map/DuplicateAlert';
import { GapMatrix }        from '@/components/content-map/GapMatrix';

type ViewMode = 'table' | 'matrix';

const EMPTY_FORM: Omit<ContentMapInput, 'clinicId'> = {
  title:       '',
  contentType: 'instagram',
  symptom:     '',
  theme:       '',
  target:      '',
  urlOrMemo:   '',
  status:      'planned',
  tags:        [],
  note:        '',
};

// DB から返る raw 形式（tags が JSON string）を ContentMapItem に変換
function parseItem(raw: Record<string, unknown>): ContentMapItem {
  return {
    ...raw,
    tags: (() => {
      try { return JSON.parse(raw.tags as string) as string[]; }
      catch { return []; }
    })(),
  } as ContentMapItem;
}

export default function ContentMapPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // ── 一覧 ────────────────────────────────────────────
  const [items,    setItems]    = useState<ContentMapItem[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // ── フィルター ───────────────────────────────────────
  const [filterType,    setFilterType]    = useState<MapContentType | ''>('');
  const [filterStatus,  setFilterStatus]  = useState<MapStatus | ''>('');
  const [filterSymptom, setFilterSymptom] = useState('');

  // ── 表示モード ───────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // ── 新規追加フォーム ─────────────────────────────────
  const [showAddForm,  setShowAddForm]  = useState(false);
  const [formData,     setFormData]     = useState({ ...EMPTY_FORM });
  const [submitting,   setSubmitting]   = useState(false);
  const [formError,    setFormError]    = useState<string | null>(null);

  // ── データ取得 ───────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!currentClinic) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ clinicId: currentClinic.id });
      if (filterType)    params.set('contentType', filterType);
      if (filterStatus)  params.set('status', filterStatus);
      if (filterSymptom) params.set('symptom', filterSymptom);

      const res = await fetch(`/api/content-map?${params.toString()}`);
      if (!res.ok) throw new Error('取得に失敗しました');
      const data = await res.json();
      setItems((data.items as Record<string, unknown>[]).map(parseItem));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [currentClinic, filterType, filterStatus, filterSymptom]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── 全アイテム（重複検出用・フィルターなし）──────────
  const [allItems, setAllItems] = useState<ContentMapItem[]>([]);
  const fetchAll = useCallback(async () => {
    if (!currentClinic) return;
    const res = await fetch(`/api/content-map?clinicId=${currentClinic.id}`);
    if (res.ok) {
      const data = await res.json();
      setAllItems((data.items as Record<string, unknown>[]).map(parseItem));
    }
  }, [currentClinic]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── 新規作成 ─────────────────────────────────────────
  const handleAdd = async () => {
    if (!currentClinic || !formData.title.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const body: ContentMapInput = { ...formData, clinicId: currentClinic.id };
      const res = await fetch('/api/content-map', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? '作成に失敗しました');
      }
      setFormData({ ...EMPTY_FORM });
      setShowAddForm(false);
      await fetchItems();
      await fetchAll();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  // ── 更新 ─────────────────────────────────────────────
  const handleUpdate = async (id: string, data: Partial<ContentMapItem>) => {
    const res = await fetch(`/api/content-map/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...data, tags: data.tags ?? [] }),
    });
    if (res.ok) {
      await fetchItems();
      await fetchAll();
    }
  };

  // ── 削除 ─────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/content-map/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchItems();
      await fetchAll();
    }
  };

  // ── ギャップマトリクスから追加フォームを起動 ─────────
  const handleAddGap = (symptom: string, contentType: MapContentType) => {
    setFormData({ ...EMPTY_FORM, symptom, contentType });
    setShowAddForm(true);
    setViewMode('table');
    setTimeout(() => {
      document.getElementById('add-form-title')?.focus();
    }, 100);
  };

  // ── フィルター済みアイテム ───────────────────────────
  const filteredItems = items; // サーバー側でフィルター済み

  // ── クリア ───────────────────────────────────────────
  const clearFilter = () => {
    setFilterType('');
    setFilterStatus('');
    setFilterSymptom('');
  };

  return (
    <div className="space-y-5">
      {/* ── ヘッダー ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', color.bg)}>
            <Map size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">コンテンツ管理マップ</h1>
            <p className="text-sm text-slate-500">コンテンツの進捗管理と不足領域の可視化</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 表示切替 */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition',
                viewMode === 'table'
                  ? cn('text-white', color.bg)
                  : 'text-slate-500 hover:bg-slate-50',
              )}
            >
              <Table2 size={13} />一覧
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition',
                viewMode === 'matrix'
                  ? cn('text-white', color.bg)
                  : 'text-slate-500 hover:bg-slate-50',
              )}
            >
              <LayoutGrid size={13} />ギャップ
            </button>
          </div>

          {/* 追加ボタン */}
          <button
            onClick={() => { setShowAddForm((v) => !v); setFormData({ ...EMPTY_FORM }); }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition',
              showAddForm ? 'bg-slate-100 text-slate-700' : cn('text-white shadow-sm hover:opacity-90', color.bg),
            )}
          >
            <Plus size={15} />
            {showAddForm ? 'キャンセル' : 'コンテンツを追加'}
          </button>
        </div>
      </div>

      {/* ── 重複アラート ── */}
      <DuplicateAlert items={allItems} />

      {/* ── 新規追加フォーム ── */}
      {showAddForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-800">新規コンテンツを追加</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* タイトル */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                タイトル <span className="text-red-500">*</span>
              </label>
              <input
                id="add-form-title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例: 腰痛改善ブログ記事"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* 種別 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">コンテンツ種別</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value as MapContentType })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                {MAP_CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>{MAP_CONTENT_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* ステータス */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ステータス</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as MapStatus })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
              >
                <option value="planned">{MAP_STATUS_LABELS.planned}</option>
                <option value="creating">{MAP_STATUS_LABELS.creating}</option>
                <option value="published">{MAP_STATUS_LABELS.published}</option>
              </select>
            </div>

            {/* 症状 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">症状</label>
              <input
                type="text"
                value={formData.symptom}
                onChange={(e) => setFormData({ ...formData, symptom: e.target.value })}
                placeholder="例: 腰痛"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* テーマ */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">テーマ</label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="例: ストレートネック"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* ターゲット */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ターゲット</label>
              <input
                type="text"
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                placeholder="例: 30代デスクワーク女性"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* URL/メモ */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">URL / メモ</label>
              <input
                type="text"
                value={formData.urlOrMemo}
                onChange={(e) => setFormData({ ...formData, urlOrMemo: e.target.value })}
                placeholder="https://... または備考メモ"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* 備考 */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">備考</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                rows={2}
                placeholder="担当者・締め切りなどのメモ"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>
          </div>

          {formError && (
            <p className="text-xs text-red-600">{formError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowAddForm(false); setFormData({ ...EMPTY_FORM }); }}
              className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleAdd}
              disabled={submitting || !formData.title.trim()}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition',
                formData.title.trim() && !submitting
                  ? cn('text-white shadow-sm hover:opacity-90', color.bg)
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              )}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              追加する
            </button>
          </div>
        </div>
      )}

      {/* ── フィルター（テーブルビュー） ── */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <ContentMapFilter
            filterType={filterType}
            filterStatus={filterStatus}
            filterSymptom={filterSymptom}
            onTypeChange={setFilterType}
            onStatusChange={setFilterStatus}
            onSymptomChange={setFilterSymptom}
            onClear={clearFilter}
            totalCount={allItems.length}
            filteredCount={filteredItems.length}
          />
        </div>
      )}

      {/* ── メインコンテンツ ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 size={28} className="animate-spin mr-3" />
            <span className="text-sm">読み込み中...</span>
          </div>
        ) : viewMode === 'table' ? (
          <ContentMapTable
            items={filteredItems}
            accentBg={color.bg}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ) : (
          <GapMatrix
            items={allItems}
            accentBg={color.bg}
            onAddGap={handleAddGap}
          />
        )}
      </div>
    </div>
  );
}
