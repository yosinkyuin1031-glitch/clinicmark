'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { FileImage, Sparkles, Upload, Plus, X, Filter, Loader2 } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { FlyerCard } from '@/components/flyers/FlyerCard';
import {
  FLYER_TYPE_LABELS, FLYER_TYPES,
  type Flyer, type FlyerType, type FlyerGenInput,
} from '@/types';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

const EMPTY_FORM: FlyerGenInput = {
  clinicId: '', theme: '', flyerType: 'A4', target: '', campaign: '', tone: 'friendly',
};

export default function FlyersPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [flyers,       setFlyers]       = useState<Flyer[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [showPanel,    setShowPanel]    = useState(false);
  const [editTarget,   setEditTarget]   = useState<Flyer | null>(null);
  const [panelTab,     setPanelTab]     = useState<'generate' | 'upload'>('generate');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // フォーム状態
  const [genInput, setGenInput] = useState<FlyerGenInput>({ ...EMPTY_FORM });
  // 編集モード用フィールド
  const [editFields, setEditFields] = useState<Partial<Flyer>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  const fetchFlyers = useCallback(async () => {
    if (!currentClinic) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ clinicId: currentClinic.id });
      if (statusFilter) params.set('status',    statusFilter);
      if (typeFilter)   params.set('flyerType', typeFilter);
      const res  = await fetch(`/api/flyers?${params}`);
      const json = await res.json();
      setFlyers(json.data ?? []);
    } finally { setLoading(false); }
  }, [currentClinic, statusFilter, typeFilter]);

  useEffect(() => { fetchFlyers(); }, [fetchFlyers]);

  // ── AI 生成 ─────────────────────────────────────────
  async function handleGenerate() {
    if (!currentClinic || !genInput.theme) return;
    setGenerating(true);
    try {
      const res  = await fetch('/api/generate/flyer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...genInput, clinicId: currentClinic.id }),
      });
      const json = await res.json();
      if (!res.ok) { showError(json.error ?? '生成に失敗しました'); return; }
      if (json.data) {
        setEditFields((prev) => ({ ...prev, ...json.data }));
        setPanelTab('upload');
        success('コピーを生成しました');
      }
    } catch { showError('ネットワークエラーが発生しました'); }
    finally { setGenerating(false); }
  }

  // ── ファイルアップロード ──────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch('/api/flyers/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (json.fileUrl) {
        setEditFields((prev) => ({ ...prev, fileUrl: json.fileUrl }));
      }
    } finally { setUploading(false); }
  }

  // ── 保存（新規 or 更新）────────────────────────────────
  async function handleSave() {
    if (!currentClinic) return;
    const title = editFields.title || genInput.theme || '新規チラシ';
    const payload = {
      clinicId:    currentClinic.id,
      title,
      flyerType:   editFields.flyerType ?? genInput.flyerType ?? 'A4',
      catchCopy:   editFields.catchCopy   ?? '',
      bodyText:    editFields.bodyText    ?? '',
      backText:    editFields.backText    ?? '',
      ctaText:     editFields.ctaText     ?? '',
      targetText:  editFields.targetText  ?? genInput.target,
      designNotes: editFields.designNotes ?? '',
      fileUrl:     editFields.fileUrl     ?? '',
      status:      editFields.status      ?? 'DRAFT',
    };

    try {
      const url    = editTarget ? `/api/flyers/${editTarget.id}` : '/api/flyers';
      const method = editTarget ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const j = await res.json(); showError(j.error ?? '保存に失敗しました'); return; }
      success(editTarget ? '更新しました' : '保存しました');
      await fetchFlyers();
      handleClosePanel();
    } catch { showError('ネットワークエラーが発生しました'); }
  }

  function handleOpenCreate() {
    setEditTarget(null);
    setEditFields({});
    setGenInput({ ...EMPTY_FORM, clinicId: currentClinic?.id ?? '' });
    setPanelTab('generate');
    setShowPanel(true);
  }

  function handleSelectEdit(flyer: Flyer) {
    setEditTarget(flyer);
    setEditFields({ ...flyer });
    setGenInput({ ...EMPTY_FORM, theme: flyer.title, flyerType: flyer.flyerType, clinicId: currentClinic?.id ?? '' });
    setPanelTab('upload');
    setShowPanel(true);
  }

  function handleClosePanel() {
    setShowPanel(false);
    setEditTarget(null);
    setEditFields({});
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/flyers/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setFlyers((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
  }

  async function handleDelete(id: string) {
    setDeleteTarget(id);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/flyers/${deleteTarget}`, { method: 'DELETE' });
      setFlyers((prev) => prev.filter((f) => f.id !== deleteTarget));
      success('削除しました');
    } catch { showError('削除に失敗しました'); }
    finally { setDeleteTarget(null); }
  }

  if (!currentClinic) {
    return <div className="flex items-center justify-center h-64 text-slate-400">院を選択してください</div>;
  }

  return (
    <>
    <div className="max-w-5xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
            <FileImage size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">チラシ管理</h1>
            <p className="text-sm text-slate-500">{flyers.length}件 · {currentClinic.name}</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm', color.bg)}
        >
          <Plus size={15} />
          新規作成
        </button>
      </div>

      {/* フィルター */}
      <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-white border border-slate-200 rounded-xl">
        <Filter size={15} className="text-slate-400 shrink-0" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm border-0 text-slate-700 focus:outline-none bg-transparent cursor-pointer"
        >
          <option value="">すべての種類</option>
          {FLYER_TYPES.map((t) => <option key={t} value={t}>{FLYER_TYPE_LABELS[t]}</option>)}
        </select>
        <div className="w-px h-4 bg-slate-200" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border-0 text-slate-700 focus:outline-none bg-transparent cursor-pointer"
        >
          <option value="">すべてのステータス</option>
          <option value="DRAFT">下書き</option>
          <option value="APPROVED">確認済み</option>
          <option value="ARCHIVED">アーカイブ</option>
        </select>
      </div>

      {/* 一覧 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : flyers.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FileImage size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">チラシがまだありません</p>
          <p className="text-xs mt-1">「新規作成」からチラシコピーをAI生成できます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flyers.map((flyer) => (
            <FlyerCard
              key={flyer.id}
              flyer={flyer}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onSelect={handleSelectEdit}
            />
          ))}
        </div>
      )}

      {/* ─── サイドパネル ─────────────────────────────── */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex">
          {/* バックドロップ */}
          <div className="flex-1 bg-black/40" onClick={handleClosePanel} />

          {/* パネル本体 */}
          <div className="w-full max-w-lg bg-white flex flex-col shadow-2xl overflow-hidden">
            {/* パネルヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {editTarget ? 'チラシを編集' : '新規チラシ作成'}
              </h2>
              <button onClick={handleClosePanel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            {/* タブ */}
            <div className="flex border-b border-slate-200">
              {[
                { key: 'generate', label: '✨ AIで生成', icon: Sparkles },
                { key: 'upload',   label: '📎 内容・ファイル', icon: Upload },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPanelTab(key as 'generate' | 'upload')}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium transition',
                    panelTab === key
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* ── AIで生成タブ ── */}
              {panelTab === 'generate' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">テーマ <span className="text-red-400">*</span></label>
                    <input
                      value={genInput.theme}
                      onChange={(e) => setGenInput((p) => ({ ...p, theme: e.target.value }))}
                      placeholder="例: 腰痛改善キャンペーン"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">チラシ種類</label>
                    <select
                      value={genInput.flyerType}
                      onChange={(e) => setGenInput((p) => ({ ...p, flyerType: e.target.value as FlyerType }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {FLYER_TYPES.map((t) => <option key={t} value={t}>{FLYER_TYPE_LABELS[t]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">ターゲット</label>
                    <input
                      value={genInput.target}
                      onChange={(e) => setGenInput((p) => ({ ...p, target: e.target.value }))}
                      placeholder="例: 腰痛に悩む40〜60代"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">キャンペーン内容（任意）</label>
                    <textarea
                      value={genInput.campaign}
                      onChange={(e) => setGenInput((p) => ({ ...p, campaign: e.target.value }))}
                      placeholder="例: 初回体験1,000円引き（6月末まで）"
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">文体</label>
                    <select
                      value={genInput.tone}
                      onChange={(e) => setGenInput((p) => ({ ...p, tone: e.target.value as typeof genInput.tone }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="friendly">やわらかく親しみやすい</option>
                      <option value="formal">丁寧でプロフェッショナル</option>
                      <option value="casual">カジュアル</option>
                    </select>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !genInput.theme}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition',
                      generating || !genInput.theme ? 'bg-slate-300 cursor-not-allowed' : cn(color.bg),
                    )}
                  >
                    {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                    {generating ? '生成中...' : 'AIでコピーを生成'}
                  </button>
                </>
              )}

              {/* ── 内容・ファイルタブ ── */}
              {panelTab === 'upload' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">タイトル</label>
                    <input
                      value={editFields.title ?? ''}
                      onChange={(e) => setEditFields((p) => ({ ...p, title: e.target.value }))}
                      placeholder="例: 腰痛改善チラシ 2024年版"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  {[
                    { key: 'catchCopy',   label: 'キャッチコピー', rows: 1,  placeholder: '例: 腰痛でお悩みの方へ' },
                    { key: 'bodyText',    label: '本文（表面）',   rows: 4,  placeholder: 'チラシ表面の本文' },
                    { key: 'backText',    label: '裏面テキスト',   rows: 3,  placeholder: 'チラシ裏面の情報（任意）' },
                    { key: 'ctaText',     label: 'CTA文',          rows: 1,  placeholder: '例: QRコードからご予約' },
                    { key: 'designNotes', label: 'デザインメモ',   rows: 2,  placeholder: 'デザイナーへの指示（任意）' },
                  ].map(({ key, label, rows, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                      <textarea
                        value={(editFields as Record<string, string>)[key] ?? ''}
                        onChange={(e) => setEditFields((p) => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        rows={rows}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>
                  ))}

                  {/* ファイルアップロード */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">ファイル（PDF/画像）</label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition"
                    >
                      {editFields.fileUrl ? (
                        <p className="text-xs text-emerald-600 font-medium">✓ {editFields.fileUrl.split('/').pop()}</p>
                      ) : (
                        <>
                          <Upload size={20} className="mx-auto mb-1 text-slate-400" />
                          <p className="text-xs text-slate-500">クリックまたはドラッグでアップロード</p>
                          <p className="text-xs text-slate-400">PDF / PNG / JPG</p>
                        </>
                      )}
                      {uploading && <p className="text-xs text-blue-500 mt-1">アップロード中...</p>}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </>
              )}
            </div>

            {/* フッター */}
            <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
              <button onClick={handleClosePanel} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className={cn('flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition', color.bg)}
              >
                {editTarget ? '更新' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    <ConfirmDialog
      open={!!deleteTarget}
      title="チラシを削除しますか？"
      description="この操作は元に戻せません。"
      confirmLabel="削除する"
      onConfirm={confirmDelete}
      onCancel={() => setDeleteTarget(null)}
    />
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
