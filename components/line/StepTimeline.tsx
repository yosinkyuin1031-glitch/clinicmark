'use client';

import { useState } from 'react';
import { Clock, Plus, Trash2, Check, X, Edit2 } from 'lucide-react';
import type { LineStep } from '@/types';
import { cn } from '@/lib/utils/clinic';

interface Props {
  steps:      LineStep[];
  onAddStep:  (step: Omit<LineStep, 'id' | 'scenarioId' | 'stepNumber' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onEditStep: (id: string, data: Partial<LineStep>) => Promise<void>;
  onDeleteStep:(id: string) => Promise<void>;
  accentColor: string;
}

interface EditState {
  title:      string;
  message:    string;
  delayDays:  number;
  delayHours: number;
  condition:  string;
}

const EMPTY_EDIT: EditState = { title: '', message: '', delayDays: 0, delayHours: 0, condition: '' };

function delayLabel(days: number, hours: number): string {
  if (days === 0 && hours === 0) return '即時';
  const parts: string[] = [];
  if (days  !== 0) parts.push(`${days}日後`);
  if (hours !== 0) parts.push(`${hours}時間後`);
  return parts.join(' ');
}

export function StepTimeline({ steps, onAddStep, onEditStep, onDeleteStep, accentColor }: Props) {
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [addingNew,  setAddingNew]  = useState(false);
  const [editState,  setEditState]  = useState<EditState>(EMPTY_EDIT);
  const [newState,   setNewState]   = useState<EditState>(EMPTY_EDIT);

  function startEdit(step: LineStep) {
    setEditingId(step.id);
    setEditState({
      title:      step.title,
      message:    step.message,
      delayDays:  step.delayDays,
      delayHours: step.delayHours,
      condition:  step.condition,
    });
  }

  async function saveEdit(id: string) {
    await onEditStep(id, editState);
    setEditingId(null);
  }

  async function saveNew() {
    if (!newState.title || !newState.message) return;
    await onAddStep(newState);
    setNewState(EMPTY_EDIT);
    setAddingNew(false);
  }

  return (
    <div className="space-y-1">
      {steps.map((step, idx) => (
        <div key={step.id} className="relative flex gap-4">
          {/* タイムラインライン */}
          <div className="flex flex-col items-center">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0', accentColor)}>
              {step.stepNumber}
            </div>
            {idx < steps.length - 1 && (
              <div className="w-0.5 flex-1 bg-slate-200 mt-1 mb-1 min-h-[1.5rem]" />
            )}
          </div>

          {/* ステップコンテンツ */}
          <div className="flex-1 pb-4 min-w-0">
            {editingId === step.id ? (
              /* 編集フォーム */
              <div className="bg-white border border-blue-300 rounded-xl p-4 space-y-3 shadow-sm">
                <input
                  value={editState.title}
                  onChange={(e) => setEditState((s) => ({ ...s, title: e.target.value }))}
                  placeholder="ステップタイトル"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">遅延日数</label>
                    <input
                      type="number" min={0}
                      value={editState.delayDays}
                      onChange={(e) => setEditState((s) => ({ ...s, delayDays: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">遅延時間</label>
                    <input
                      type="number" min={0} max={23}
                      value={editState.delayHours}
                      onChange={(e) => setEditState((s) => ({ ...s, delayHours: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
                <textarea
                  value={editState.message}
                  onChange={(e) => setEditState((s) => ({ ...s, message: e.target.value }))}
                  placeholder="メッセージ本文"
                  rows={5}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                <input
                  value={editState.condition}
                  onChange={(e) => setEditState((s) => ({ ...s, condition: e.target.value }))}
                  placeholder="送信タイミングの説明（任意）"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <X size={12} /> キャンセル
                  </button>
                  <button onClick={() => saveEdit(step.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Check size={12} /> 保存
                  </button>
                </div>
              </div>
            ) : (
              /* 表示モード */
              <div className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition group">
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{step.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock size={10} className="text-slate-400" />
                      <span className="text-xs text-slate-400">{delayLabel(step.delayDays, step.delayHours)}</span>
                      {step.condition && (
                        <span className="text-xs text-slate-400">· {step.condition}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                    <button onClick={() => startEdit(step)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => onDeleteStep(step.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-slate-600 leading-relaxed font-sans line-clamp-3">
                  {step.message}
                </pre>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* 新規ステップ追加 */}
      {addingNew ? (
        <div className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-slate-300 shrink-0">
              {steps.length + 1}
            </div>
          </div>
          <div className="flex-1 pb-4 min-w-0">
            <div className="bg-white border border-slate-300 border-dashed rounded-xl p-4 space-y-3">
              <input
                value={newState.title}
                onChange={(e) => setNewState((s) => ({ ...s, title: e.target.value }))}
                placeholder="ステップタイトル"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                autoFocus
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">遅延日数</label>
                  <input
                    type="number" min={0}
                    value={newState.delayDays}
                    onChange={(e) => setNewState((s) => ({ ...s, delayDays: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500 mb-1 block">遅延時間</label>
                  <input
                    type="number" min={0} max={23}
                    value={newState.delayHours}
                    onChange={(e) => setNewState((s) => ({ ...s, delayHours: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>
              <textarea
                value={newState.message}
                onChange={(e) => setNewState((s) => ({ ...s, message: e.target.value }))}
                placeholder="メッセージ本文"
                rows={5}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <input
                value={newState.condition}
                onChange={(e) => setNewState((s) => ({ ...s, condition: e.target.value }))}
                placeholder="送信タイミングの説明（任意）"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setAddingNew(false); setNewState(EMPTY_EDIT); }} className="flex items-center gap-1 text-xs px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg">
                  <X size={12} /> キャンセル
                </button>
                <button onClick={saveNew} disabled={!newState.title || !newState.message} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  <Check size={12} /> 追加
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingNew(true)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 py-2 px-3 rounded-xl hover:bg-blue-50 transition w-full"
        >
          <Plus size={15} /> ステップを追加
        </button>
      )}
    </div>
  );
}
