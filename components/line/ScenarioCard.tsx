'use client';

import { GitBranch, Trash2, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import type { LineScenario } from '@/types';
import { SCENARIO_TYPE_LABELS, SCENARIO_TYPE_COLORS } from '@/types';
import { cn, formatDate } from '@/lib/utils/clinic';

interface Props {
  scenario:  LineScenario;
  selected:  boolean;
  onSelect:  (s: LineScenario) => void;
  onDelete:  (id: string) => Promise<void>;
  onToggle:  (id: string, isActive: boolean) => Promise<void>;
}

export function ScenarioCard({ scenario, selected, onSelect, onDelete, onToggle }: Props) {
  const typeColor = SCENARIO_TYPE_COLORS[scenario.scenarioType] ?? 'bg-slate-100 text-slate-600';
  const typeLabel = SCENARIO_TYPE_LABELS[scenario.scenarioType] ?? scenario.scenarioType;

  return (
    <div
      className={cn(
        'bg-white border rounded-xl overflow-hidden cursor-pointer transition hover:shadow-sm',
        selected ? 'border-blue-400 ring-1 ring-blue-300' : 'border-slate-200',
      )}
      onClick={() => onSelect(scenario)}
    >
      <div className="px-4 py-3 flex items-center gap-3">
        {/* タイプバッジ */}
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', typeColor)}>
          {typeLabel}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{scenario.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {scenario.steps.length} ステップ · {formatDate(scenario.createdAt)}
          </p>
        </div>

        {/* アクティブ切替 */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(scenario.id, !scenario.isActive); }}
          className={cn(
            'p-1 rounded-lg transition',
            scenario.isActive
              ? 'text-emerald-500 hover:bg-emerald-50'
              : 'text-slate-300 hover:bg-slate-50',
          )}
          title={scenario.isActive ? '無効にする' : '有効にする'}
        >
          {scenario.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
        </button>

        {/* 削除 */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(scenario.id); }}
          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          title="削除"
        >
          <Trash2 size={14} />
        </button>

        {/* 選択矢印 */}
        <ChevronRight size={14} className={cn('shrink-0 transition', selected ? 'text-blue-500' : 'text-slate-300')} />
      </div>

      {/* トリガーメモ */}
      {scenario.triggerMemo && (
        <div className="px-4 pb-2.5 flex items-start gap-1.5">
          <GitBranch size={11} className="text-slate-300 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 line-clamp-1">{scenario.triggerMemo}</p>
        </div>
      )}
    </div>
  );
}
