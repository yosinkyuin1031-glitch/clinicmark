'use client';

import { CheckCircle2, PlusCircle } from 'lucide-react';
import {
  MAP_CONTENT_TYPES,
  MAP_CONTENT_TYPE_LABELS,
  type ContentMapItem,
  type MapContentType,
} from '@/types';
import { cn } from '@/lib/utils/clinic';

interface Props {
  items:     ContentMapItem[];
  accentBg:  string;
  onAddGap:  (symptom: string, contentType: MapContentType) => void;
}

export function GapMatrix({ items, accentBg, onAddGap }: Props) {
  // 症状一覧（重複なし・空除く）
  const symptoms = [...new Set(
    items.map((i) => i.symptom).filter(Boolean)
  )].sort();

  if (symptoms.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        症状が登録されたコンテンツがないためマトリクスを表示できません
      </div>
    );
  }

  // 各セルの件数を計算
  const countMap = new Map<string, number>();
  for (const item of items) {
    if (!item.symptom) continue;
    const key = `${item.symptom}::${item.contentType}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 w-32">
              症状
            </th>
            {MAP_CONTENT_TYPES.map((type) => (
              <th
                key={type}
                className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 text-center whitespace-nowrap"
              >
                {MAP_CONTENT_TYPE_LABELS[type]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symptoms.map((symptom) => (
            <tr key={symptom}>
              <td className="px-3 py-2 border border-slate-200 font-medium text-slate-700 whitespace-nowrap bg-slate-50 text-xs">
                {symptom}
              </td>
              {MAP_CONTENT_TYPES.map((type) => {
                const key   = `${symptom}::${type}`;
                const count = countMap.get(key) ?? 0;
                const isEmpty = count === 0;

                return (
                  <td
                    key={type}
                    className={cn(
                      'border border-slate-200 text-center',
                      isEmpty ? 'cursor-pointer hover:bg-slate-50' : '',
                    )}
                    onClick={() => isEmpty && onAddGap(symptom, type)}
                    title={isEmpty ? '+ 追加する' : `${count} 件`}
                  >
                    {isEmpty ? (
                      <div className="flex items-center justify-center py-2 text-slate-300 hover:text-slate-400 transition">
                        <PlusCircle size={16} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2 gap-0.5">
                        <CheckCircle2 size={14} className="text-green-500" />
                        {count >= 2 && (
                          <span className="text-xs text-amber-600 font-medium">{count}件</span>
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
