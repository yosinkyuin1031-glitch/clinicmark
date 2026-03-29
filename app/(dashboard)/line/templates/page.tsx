'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Plus, X, Sparkles, Loader2, PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { TemplateCard } from '@/components/line/TemplateCard';
import {
  LINE_CATEGORY_LABELS, LINE_CATEGORIES,
  type LineTemplate, type LineCategory, type LineQuickReply,
} from '@/types';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

type PanelMode = 'create' | 'edit' | null;

const EMPTY_QR: LineQuickReply = { label: '', text: '' };

export default function LineTemplatesPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [templates,      setTemplates]      = useState<LineTemplate[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [panelMode,      setPanelMode]      = useState<PanelMode>(null);
  const [editTarget,     setEditTarget]     = useState<LineTemplate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<LineCategory | ''>('');
  const [generating,     setGenerating]     = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState<string | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  // フォーム状態
  const [formTitle,        setFormTitle]        = useState('');
  const [formCategory,     setFormCategory]     = useState<LineCategory>('greeting');
  const [formMessage,      setFormMessage]      = useState('');
  const [formContext,      setFormContext]       = useState('');
  const [formTone,         setFormTone]         = useState<'friendly' | 'formal' | 'casual'>('friendly');
  const [formQuickReplies, setFormQuickReplies] = useState<LineQuickReply[]>([]);

  const fetchTemplates = useCallback(async () => {
    if (!currentClinic) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ clinicId: currentClinic.id });
      if (categoryFilter) params.set('category', categoryFilter);
      const res  = await fetch(`/api/line/templates?${params}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `サーバーエラー (${res.status})`);
      }
      const json = await res.json();
      setTemplates(json.data ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'テンプレートの取得に失敗しました';
      setError(msg);
      console.error('[fetchTemplates]', e);
    } finally { setLoading(false); }
  }, [currentClinic, categoryFilter]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  function openCreate() {
    setEditTarget(null);
    setFormTitle(''); setFormCategory('greeting'); setFormMessage('');
    setFormContext(''); setFormTone('friendly'); setFormQuickReplies([]);
    setPanelMode('create');
  }

  function openEdit(t: LineTemplate) {
    setEditTarget(t);
    setFormTitle(t.title); setFormCategory(t.category); setFormMessage(t.message);
    setFormContext(''); setFormTone('friendly'); setFormQuickReplies([...t.quickReplies]);
    setPanelMode('edit');
  }

  function closePanel() { setPanelMode(null); setEditTarget(null); }

  async function handleGenerate() {
    if (!currentClinic) return;
    setGenerating(true);
    try {
      const res  = await fetch('/api/generate/line-template', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: currentClinic.id, category: formCategory, context: formContext, tone: formTone }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'AI生成に失敗しました');
      }
      const json = await res.json();
      if (json.data?.message) { setFormMessage(json.data.message); success('メッセージを生成しました'); }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI生成に失敗しました';
      showError(msg);
      console.error('[handleGenerate]', e);
    } finally { setGenerating(false); }
  }

  async function handleRegenerate(t: LineTemplate) {
    openEdit(t);
    // 再生成はパネルを開いてユーザーが「AI生成」ボタンを押す
  }

  async function handleSave() {
    if (!currentClinic || !formTitle || !formMessage) return;
    const payload = {
      clinicId: currentClinic.id, title: formTitle, category: formCategory,
      message: formMessage, quickReplies: formQuickReplies,
    };
    try {
      const url    = editTarget ? `/api/line/templates/${editTarget.id}` : '/api/line/templates';
      const method = editTarget ? 'PATCH' : 'POST';
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || '保存に失敗しました');
      }
      success(editTarget ? '更新しました' : '保存しました');
      await fetchTemplates();
      closePanel();
    } catch (e) {
      const msg = e instanceof Error ? e.message : '保存に失敗しました';
      showError(msg);
      console.error('[handleSave]', e);
    }
  }

  async function handleDelete(id: string) {
    setDeleteTarget(id);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/line/templates/${deleteTarget}`, { method: 'DELETE' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || '削除に失敗しました');
      }
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget));
      success('削除しました');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '削除に失敗しました';
      showError(msg);
      console.error('[confirmDelete]', e);
    } finally { setDeleteTarget(null); }
  }

  function addQR()        { setFormQuickReplies((prev) => [...prev, { ...EMPTY_QR }]); }
  function removeQR(i: number) { setFormQuickReplies((prev) => prev.filter((_, idx) => idx !== i)); }
  function updateQR(i: number, field: keyof LineQuickReply, val: string) {
    setFormQuickReplies((prev) => prev.map((qr, idx) => idx === i ? { ...qr, [field]: val } : qr));
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
            <MessageCircle size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">LINE テンプレート</h1>
            <p className="text-sm text-slate-500">{templates.length}件 · {currentClinic.name}</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white shadow-sm', color.bg)}
        >
          <Plus size={15} /> 新規作成
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-5 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* カテゴリフィルター */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['', ...LINE_CATEGORIES] as (LineCategory | ''[])[]).flat().map((cat) => (
          <button
            key={cat as string}
            onClick={() => setCategoryFilter(cat as LineCategory | '')}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-full transition',
              categoryFilter === cat
                ? cn(color.bg, 'text-white')
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {cat ? LINE_CATEGORY_LABELS[cat as LineCategory] : 'すべて'}
          </button>
        ))}
      </div>

      {/* 一覧 */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <MessageCircle size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">テンプレートがまだありません</p>
          <p className="text-xs mt-1">「新規作成」からAIでメッセージを生成できます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onDelete={handleDelete} onEdit={openEdit} onRegenerate={handleRegenerate} />
          ))}
        </div>
      )}

      {/* サイドパネル */}
      {panelMode && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={closePanel} />
          <div className="w-full max-w-lg bg-white flex flex-col shadow-2xl">
            {/* パネルヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {panelMode === 'edit' ? 'テンプレートを編集' : '新規テンプレート'}
              </h2>
              <button onClick={closePanel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* タイトル */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">タイトル <span className="text-red-400">*</span></label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                  maxLength={100}
                  placeholder="例: 初回予約後の挨拶メッセージ"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>

              {/* カテゴリ */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">カテゴリ</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as LineCategory)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {LINE_CATEGORIES.map((c) => <option key={c} value={c}>{LINE_CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>

              {/* AI生成設定 */}
              <div className="p-3 bg-violet-50 rounded-xl border border-violet-100 space-y-3">
                <p className="text-xs font-semibold text-violet-700 flex items-center gap-1.5"><Sparkles size={12} /> AI でメッセージを生成</p>
                <input value={formContext} onChange={(e) => setFormContext(e.target.value)}
                  placeholder="例: 初回予約完了後に送る挨拶文"
                  className="w-full border border-violet-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white" />
                <div className="flex gap-2">
                  <select value={formTone} onChange={(e) => setFormTone(e.target.value as typeof formTone)}
                    className="flex-1 border border-violet-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white">
                    <option value="friendly">やわらかく親しみやすい</option>
                    <option value="formal">丁寧でプロフェッショナル</option>
                    <option value="casual">カジュアル</option>
                  </select>
                  <button onClick={handleGenerate} disabled={generating}
                    className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white transition',
                      generating ? 'bg-violet-300 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700')}>
                    {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {generating ? '生成中...' : '生成'}
                  </button>
                </div>
              </div>

              {/* メッセージ本文 */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">メッセージ本文 <span className="text-red-400">*</span></label>
                <textarea value={formMessage} onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="LINE メッセージの本文を入力"
                  maxLength={1000}
                  rows={8}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
                <p className="text-xs text-slate-400 mt-1 text-right">{formMessage.length} / 1000字</p>
              </div>

              {/* クイックリプライ */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600">クイックリプライ（任意）</label>
                  <button onClick={addQR} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                    <PlusCircle size={12} /> 追加
                  </button>
                </div>
                {formQuickReplies.map((qr, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={qr.label} onChange={(e) => updateQR(i, 'label', e.target.value)}
                      placeholder="ラベル（例: 予約する）"
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <input value={qr.text} onChange={(e) => updateQR(i, 'text', e.target.value)}
                      placeholder="返信テキスト"
                      className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    <button onClick={() => removeQR(i)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* フッター */}
            <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
              <button onClick={closePanel} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">キャンセル</button>
              <button onClick={handleSave} disabled={!formTitle || !formMessage}
                className={cn('flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition',
                  !formTitle || !formMessage ? 'bg-slate-300 cursor-not-allowed' : color.bg)}>
                {panelMode === 'edit' ? '更新' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    <ConfirmDialog
      open={!!deleteTarget}
      title="テンプレートを削除しますか？"
      description="この操作は元に戻せません。"
      confirmLabel="削除する"
      onConfirm={confirmDelete}
      onCancel={() => setDeleteTarget(null)}
    />
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
