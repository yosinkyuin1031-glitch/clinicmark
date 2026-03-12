'use client';

import { AlertTriangle } from 'lucide-react';
import type { ContentMapItem, MapContentType } from '@/types';

interface Props {
  items: ContentMapItem[];
}

interface DupKey {
  symptom:     string;
  contentType: MapContentType;
  count:       number;
}

/**
 * 同一 symptom × contentType の組み合わせが2件以上あればアラートを表示
 */
export function DuplicateAlert({ items }: Props) {
  // 重複集計
  const countMap = new Map<string, number>();
  for (const item of items) {
    if (!item.symptom) continue;
    const key = `${item.symptom}::${item.contentType}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  const dups: DupKey[] = [];
  for (const [key, count] of countMap.entries()) {
    if (count >= 2) {
      const [symptom, contentType] = key.split('::');
      dups.push({ symptom, contentType: contentType as MapContentType, count });
    }
  }

  if (dups.length === 0) return null;

  return (
    <div className="flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
      <div>
        <span className="font-semibold">重複コンテンツが検出されました</span>
        <ul className="mt-1 space-y-0.5 text-xs text-amber-700">
          {dups.map(({ symptom, contentType, count }) => (
            <li key={`${symptom}-${contentType}`}>
              「{symptom}」×「{contentType}」が {count} 件
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
