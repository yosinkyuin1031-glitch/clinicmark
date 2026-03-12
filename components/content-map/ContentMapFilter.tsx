'use client';

import { X } from 'lucide-react';
import {
  MAP_CONTENT_TYPES,
  MAP_CONTENT_TYPE_LABELS,
  MAP_STATUS_LABELS,
  MAP_STATUS_COLORS,
  type MapContentType,
  type MapStatus,
} from '@/types';
import { cn } from '@/lib/utils/clinic';

const STATUS_OPTIONS: MapStatus[] = ['planned', 'creating', 'published'];

interface Props {
  filterType:    MapContentType | '';
  filterStatus:  MapStatus | '';
  filterSymptom: string;
  onTypeChange:    (v: MapContentType | '') => void;
  onStatusChange:  (v: MapStatus | '') => void;
  onSymptomChange: (v: string) => void;
  onClear: () => void;
  totalCount:    number;
  filteredCount: number;
}

export function ContentMapFilter({
  filterType, filterStatus, filterSymptom,
  onTypeChange, onStatusChange, onSymptomChange, onClear,
  totalCount, filteredCount,
}: Props) {
  const hasFilter = !!filterType || !!filterStatus || !!filterSymptom;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* コンテンツ種別 */}
      <select
        value={filterType}
        onChange={(e) => onTypeChange(e.target.value as MapContentType | '')}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
      >
        <option value="">すべての種別</option>
        {MAP_CONTENT_TYPES.map((t) => (
          <option key={t} value={t}>{MAP_CONTENT_TYPE_LABELS[t]}</option>
        ))}
      </select>

      {/* ステータス */}
      <select
        value={filterStatus}
        onChange={(e) => onStatusChange(e.target.value as MapStatus | '')}
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white"
      >
        <option value="">すべてのステータス</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>{MAP_STATUS_LABELS[s]}</option>
        ))}
      </select>

      {/* 症状フィルター */}
      <input
        type="text"
        value={filterSymptom}
        onChange={(e) => onSymptomChange(e.target.value)}
        placeholder="症状で絞り込み"
        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 w-40"
      />

      {/* クリア */}
      {hasFilter && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition"
        >
          <X size={13} />クリア
        </button>
      )}

      {/* カウント */}
      <span className="ml-auto text-xs text-slate-400">
        {hasFilter
          ? `${filteredCount} / ${totalCount} 件`
          : `${totalCount} 件`}
      </span>
    </div>
  );
}
