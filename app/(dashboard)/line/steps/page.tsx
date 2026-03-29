'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  GitBranch, Plus, X, Sparkles, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { ScenarioCard } from '@/components/line/ScenarioCard';
import { StepTimeline } from '@/components/line/StepTimeline';
import {
  SCENARIO_TYPES, SCENARIO_TYPE_LABELS,
  type LineScenario, type LineStep, type ScenarioType,
} from '@/types';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

type PanelMode = 'create' | 'edit' | null;

export default function LineStepsPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [scenarios,    setScenarios]    = useState<LineScenario[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [selected,     setSelected]     = useState<LineScenario | null>(null);
  const [panelMode,    setPanelMode]    = useState<PanelMode>(null);
  const [typeFilter,      setTypeFilter]      = useState<ScenarioType | ''>('');
  const [generating,      setGenerating]      = useState(false);
  const [deleteScenario,  setDeleteScenario]  = useState<string | null>(null);
  const [deleteStep,      setDeleteStep]      = useState<string | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  // 新規作成フォーム状態
  const [formTitle,        setFormTitle]        = useState('');
  const [formType,         setFormType]         = useState<ScenarioType>('pre_visit');
  const [formDescription,  setFormDescription]  = useState('');
  const [formTriggerMemo,  setFormTriggerMemo]  = useState('');
  // AI生成用
  const [aiTheme,          setAiTheme]          = useState('');
  const [aiTarget,         setAiTarget]         = useState('');
  const [aiStepCount,      setAiStepCount]      = useState(3);
  const [aiTone,           setAiTone]           = useState<'friendly' | 'formal' | 'casual'>('friendly');

  // ─── フェッチ ──────────────────────────────────────────
  const fetchScenarios = useCallback(async () => {
    if (!currentClinic) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ clinicId: currentClinic.id });
      if (typeFilter) params.set('scenarioType', typeFilter);
      const res  = await fetch(`/api/line/scenarios?${params}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `サーバーエラー (${res.status})`);
      }
      const json = await res.json();
      const items = json.data ?? [];
      setScenarios(items);
      // 選択中シナリオを更新
      if (selected) {
        const updated = items.find((s: LineScenario) => s.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'シナリオの取得に失敗しました';
      setError(msg);
      console.error('[fetchScenarios]', e);
    } finally { setLoading(false); }
  }, [currentClinic, typeFilter, selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchScenarios(); }, [currentClinic, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── シナリオ作成 ──────────────────────────────────────
  function openCreate() {
    setFormTitle(''); setFormType('pre_visit');
    setFormDescription(''); setFormTriggerMemo('');
    setAiTheme(''); setAiTarget(''); setAiStepCount(3); setAiTone('friendly');
    setPanelMode('create');
  }

  function closePanel() { setPanelMode(null); }

  async function handleSaveScenario() {
    if (!currentClinic || !formTitle) return;
    try {
      const res = await fetch('/api/line/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: currentClinic.id,
          title: formTitle, scenarioType: formType,
          description: formDescription, triggerMemo: formTriggerMemo,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'シナリオの作成に失敗しました');
      }
      const json = await res.json();
      await fetchScenarios();
      setSelected(json.data);
      closePanel();
      success('シナリオを作成しました');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'シナリオの作成に失敗しました';
      showError(msg);
      console.error('[handleSaveScenario]', e);
    }
  }

  // ─── AI 一括生成 ───────────────────────────────────────
  async function handleAIGenerate() {
    if (!currentClinic || !aiTheme) return;
    setGenerating(true);
    try {
      // 1. シナリオ作成
      const scenarioRes = await fetch('/api/line/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: currentClinic.id,
          title: aiTheme || `${SCENARIO_TYPE_LABELS[formType]}シナリオ`,
          scenarioType: formType,
          description: aiTarget ? `ターゲット: ${aiTarget}` : '',
          triggerMemo: '',
        }),
      });
      if (!scenarioRes.ok) {
        const errJson = await scenarioRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'シナリオの作成に失敗しました');
      }
      const scenarioJson = await scenarioRes.json();
      const newScenario: LineScenario = scenarioJson.data;

      // 2. AI でステップ生成
      const genRes = await fetch('/api/generate/line-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: currentClinic.id,
          scenarioType: formType,
          theme: aiTheme,
          target: aiTarget,
          stepCount: aiStepCount,
          tone: aiTone,
        }),
      });
      if (!genRes.ok) {
        const errJson = await genRes.json().catch(() => ({}));
        throw new Error(errJson.error || 'AIステップ生成に失敗しました');
      }
      const genJson = await genRes.json();
      const generatedSteps = genJson.data?.steps ?? [];

      // 3. 各ステップを順番に登録
      for (const step of generatedSteps) {
        const stepRes = await fetch(`/api/line/scenarios/${newScenario.id}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(step),
        });
        if (!stepRes.ok) {
          console.error('[handleAIGenerate] step save failed:', await stepRes.text());
        }
      }

      await fetchScenarios();
      // 新しいシナリオをフェッチして選択
      const updated = await fetch(`/api/line/scenarios/${newScenario.id}`).then((r) => r.json());
      setSelected(updated.data);
      closePanel();
      success('AIでシナリオを生成しました');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI生成に失敗しました';
      showError(msg);
      console.error('[handleAIGenerate]', e);
    } finally { setGenerating(false); }
  }

  // ─── シナリオ削除・トグル ──────────────────────────────
  async function handleDelete(id: string) {
    setDeleteScenario(id);
  }

  async function confirmDeleteScenario() {
    if (!deleteScenario) return;
    try {
      const res = await fetch(`/api/line/scenarios/${deleteScenario}`, { method: 'DELETE' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || '削除に失敗しました');
      }
      setScenarios((prev) => prev.filter((s) => s.id !== deleteScenario));
      if (selected?.id === deleteScenario) setSelected(null);
      success('シナリオを削除しました');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '削除に失敗しました';
      showError(msg);
      console.error('[confirmDeleteScenario]', e);
    } finally { setDeleteScenario(null); }
  }

  async function handleToggle(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/line/scenarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || '更新に失敗しました');
      }
      setScenarios((prev) => prev.map((s) => s.id === id ? { ...s, isActive } : s));
      if (selected?.id === id) setSelected((s) => s ? { ...s, isActive } : s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '更新に失敗しました';
      showError(msg);
      console.error('[handleToggle]', e);
    }
  }

  // ─── ステップ操作 ──────────────────────────────────────
  async function handleAddStep(step: Omit<LineStep, 'id' | 'scenarioId' | 'stepNumber' | 'createdAt' | 'updatedAt'>) {
    if (!selected) return;
    try {
      const res = await fetch(`/api/line/scenarios/${selected.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'ステップの追加に失敗しました');
      }
      await refreshSelected();
      success('ステップを追加しました');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ステップの追加に失敗しました';
      showError(msg);
      console.error('[handleAddStep]', e);
    }
  }

  async function handleEditStep(id: string, data: Partial<LineStep>) {
    try {
      const res = await fetch(`/api/line/steps/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'ステップの更新に失敗しました');
      }
      await refreshSelected();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ステップの更新に失敗しました';
      showError(msg);
      console.error('[handleEditStep]', e);
    }
  }

  async function handleDeleteStep(id: string) {
    setDeleteStep(id);
  }

  async function confirmDeleteStep() {
    if (!deleteStep) return;
    try {
      const res = await fetch(`/api/line/steps/${deleteStep}`, { method: 'DELETE' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'ステップの削除に失敗しました');
      }
      success('ステップを削除しました');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '削除に失敗しました';
      showError(msg);
      console.error('[confirmDeleteStep]', e);
    } finally {
      setDeleteStep(null);
      await refreshSelected();
    }
  }

  async function refreshSelected() {
    if (!selected) return;
    try {
      const res  = await fetch(`/api/line/scenarios/${selected.id}`);
      if (!res.ok) throw new Error('シナリオの更新取得に失敗しました');
      const json = await res.json();
      setSelected(json.data);
      setScenarios((prev) => prev.map((s) => s.id === selected.id ? json.data : s));
    } catch (e) {
      console.error('[refreshSelected]', e);
    }
  }

  if (!currentClinic) {
    return <div className="flex items-center justify-center h-64 text-slate-400">院を選択してください</div>;
  }

  return (
    <>
    <div className="max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
            <GitBranch size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">ステップ配信</h1>
            <p className="text-sm text-slate-500">{scenarios.length}件 · {currentClinic.name}</p>
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

      {/* タイプフィルター */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['', ...SCENARIO_TYPES] as (ScenarioType | '')[]).map((t) => (
          <button
            key={t as string}
            onClick={() => setTypeFilter(t)}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-full transition',
              typeFilter === t
                ? cn(color.bg, 'text-white')
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {t ? SCENARIO_TYPE_LABELS[t as ScenarioType] : 'すべて'}
          </button>
        ))}
      </div>

      {/* 2カラムレイアウト */}
      <div className="flex gap-5 min-h-[60vh]">
        {/* 左: シナリオ一覧 */}
        <div className="w-72 shrink-0 space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))
          ) : scenarios.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <GitBranch size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">シナリオがまだありません</p>
              <p className="text-xs mt-1">「新規作成」からAIで一括生成できます</p>
            </div>
          ) : (
            scenarios.map((s) => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                selected={selected?.id === s.id}
                onSelect={setSelected}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ))
          )}
        </div>

        {/* 右: タイムライン */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              {/* シナリオヘッダー */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selected.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {SCENARIO_TYPE_LABELS[selected.scenarioType as ScenarioType]}
                    {selected.triggerMemo && ` · ${selected.triggerMemo}`}
                  </p>
                  {selected.description && (
                    <p className="text-xs text-slate-400 mt-1">{selected.description}</p>
                  )}
                </div>
                <button
                  onClick={refreshSelected}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition"
                  title="更新"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* タイムライン */}
              <StepTimeline
                steps={selected.steps}
                onAddStep={handleAddStep}
                onEditStep={handleEditStep}
                onDeleteStep={handleDeleteStep}
                accentColor={color.bg}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <GitBranch size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">左のリストからシナリオを選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 新規作成パネル */}
      {panelMode === 'create' && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={closePanel} />
          <div className="w-full max-w-lg bg-white flex flex-col shadow-2xl">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">新規シナリオ作成</h2>
              <button onClick={closePanel} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* 基本情報 */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    シナリオ名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    maxLength={100}
                    placeholder="例: 初回来院後フォローアップ"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">シナリオ種別</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ScenarioType)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {SCENARIO_TYPES.map((t) => (
                      <option key={t} value={t}>{SCENARIO_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">説明（任意）</label>
                  <input
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="例: 施術後のフォローアップシナリオ"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">トリガーメモ（任意）</label>
                  <input
                    value={formTriggerMemo}
                    onChange={(e) => setFormTriggerMemo(e.target.value)}
                    placeholder="例: 初回予約完了後に自動配信"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* AI 一括生成 */}
              <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 space-y-3">
                <p className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
                  <Sparkles size={12} /> AI でステップを一括生成
                </p>
                <p className="text-xs text-violet-500">テーマを入力してAIが自動でステップを作成します</p>

                <input
                  value={aiTheme}
                  onChange={(e) => setAiTheme(e.target.value)}
                  placeholder="例: 腰痛施術後フォロー"
                  className="w-full border border-violet-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                />

                <input
                  value={aiTarget}
                  onChange={(e) => setAiTarget(e.target.value)}
                  placeholder="ターゲット（例: 30〜50代の腰痛患者）任意"
                  className="w-full border border-violet-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white"
                />

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-violet-600 mb-1 block">ステップ数</label>
                    <select
                      value={aiStepCount}
                      onChange={(e) => setAiStepCount(Number(e.target.value))}
                      className="w-full border border-violet-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                    >
                      {[3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>{n} ステップ</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-violet-600 mb-1 block">文体</label>
                    <select
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                      className="w-full border border-violet-200 rounded-lg px-3 py-2 text-xs focus:outline-none bg-white"
                    >
                      <option value="friendly">親しみやすい</option>
                      <option value="formal">プロフェッショナル</option>
                      <option value="casual">カジュアル</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAIGenerate}
                  disabled={generating || !aiTheme}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white transition',
                    generating || !aiTheme
                      ? 'bg-violet-300 cursor-not-allowed'
                      : 'bg-violet-600 hover:bg-violet-700',
                  )}
                >
                  {generating ? (
                    <><Loader2 size={14} className="animate-spin" /> 生成中...</>
                  ) : (
                    <><Sparkles size={14} /> AI でシナリオ一括生成</>
                  )}
                </button>
              </div>
            </div>

            {/* フッター: 手動保存 */}
            <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
              <button onClick={closePanel} className="flex-1 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                キャンセル
              </button>
              <button
                onClick={handleSaveScenario}
                disabled={!formTitle}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium text-white rounded-xl transition',
                  !formTitle ? 'bg-slate-300 cursor-not-allowed' : color.bg,
                )}
              >
                保存（ステップは後で追加）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* シナリオ削除確認 */}
    <ConfirmDialog
      open={!!deleteScenario}
      title="シナリオを削除しますか？"
      description="すべてのステップも削除されます。この操作は元に戻せません。"
      confirmLabel="削除する"
      onConfirm={confirmDeleteScenario}
      onCancel={() => setDeleteScenario(null)}
    />

    {/* ステップ削除確認 */}
    <ConfirmDialog
      open={!!deleteStep}
      title="ステップを削除しますか？"
      description="この操作は元に戻せません。"
      confirmLabel="削除する"
      onConfirm={confirmDeleteStep}
      onCancel={() => setDeleteStep(null)}
    />
    <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}
