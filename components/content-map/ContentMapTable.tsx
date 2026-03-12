'use client';

import { useState } from 'react';
import { Pencil, Trash2, ExternalLink, Check, X } from 'lucide-react';
import {
  MAP_CONTENT_TYPE_LABELS,
  MAP_STATUS_LABELS,
  MAP_STATUS_COLORS,
  MAP_CONTENT_TYPES,
  type ContentMapItem,
  type MapContentType,
  type MapStatus,
} from '@/types';
import { cn } from '@/lib/utils/clinic';

const STATUS_OPTIONS: MapStatus[] = ['planned', 'creating', 'published'];

interface Props {
  items:     ContentMapItem[];
  accentBg:  string;
  onUpdate:  (id: string, data: Partial<ContentMapItem>) => Promise<void>;
  onDelete:  (id: string) => Promise<void>;
}

interface EditState {
  id:          string;
  title:       string;
  status:      MapStatus;
  contentType: MapContentType;
  symptom:     string;
  theme:       string;
  target:      string;
  urlOrMemo:   string;
  note:        string;
}

export function ContentMapTable({ items, accentBg, onUpdate, onDelete }: Props) {
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const startEdit = (item: ContentMapItem) => {
    setEditState({
      id:          item.id,
      title:       item.title,
      status:      item.status,
      contentType: item.contentType,
      symptom:     item.symptom,
      theme:       item.theme,
      target:      item.target,
      urlOrMemo:   item.urlOrMemo,
      note:        item.note,
    });
  };

  const cancelEdit = () => setEditState(null);

  const saveEdit = async () => {
    if (!editState) return;
    await onUpdate(editState.id, {
      title:       editState.title,
      status:      editState.status,
      contentType: editState.contentType,
      symptom:     editState.symptom,
      theme:       editState.theme,
      target:      editState.target,
      urlOrMemo:   editState.urlOrMemo,
      note:        editState.note,
    });
    setEditState(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        コンテンツがまだ登録されていません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs text-slate-500 font-semibold">
            <th className="text-left px-3 py-2.5 border border-slate-200 min-w-[160px]">タイトル</th>
            <th className="text-left px-3 py-2.5 border border-slate-200 w-24">種別</th>
            <th className="text-left px-3 py-2.5 border border-slate-200 w-20">ステータス</th>
            <th className="text-left px-3 py-2.5 border border-slate-200 w-24">症状</th>
            <th className="text-left px-3 py-2.5 border border-slate-200 w-24">テーマ</th>
            <th className="text-left px-3 py-2.5 border border-slate-200 w-24">ターゲット</th>
            <th className="text-left px-3 py-2.5 border border-slate-200 w-28">URL/メモ</th>
            <th className="text-center px-3 py-2.5 border border-slate-200 w-20">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const isEditing = editState?.id === item.id;
            const isDeleting = deletingId === item.id;

            if (isEditing && editState) {
              // ── 編集行 ──────────────────────────────────
              return (
                <tr key={item.id} className="bg-blue-50">
                  <td className="px-2 py-1.5 border border-slate-200">
                    <input
                      value={editState.title}
                      onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    <select
                      value={editState.contentType}
                      onChange={(e) => setEditState({ ...editState, contentType: e.target.value as MapContentType })}
                      className="w-full border border-slate-300 rounded px-1 py-1 text-xs focus:outline-none"
                    >
                      {MAP_CONTENT_TYPES.map((t) => (
                        <option key={t} value={t}>{MAP_CONTENT_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    <select
                      value={editState.status}
                      onChange={(e) => setEditState({ ...editState, status: e.target.value as MapStatus })}
                      className="w-full border border-slate-300 rounded px-1 py-1 text-xs focus:outline-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{MAP_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    <input
                      value={editState.symptom}
                      onChange={(e) => setEditState({ ...editState, symptom: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    <input
                      value={editState.theme}
                      onChange={(e) => setEditState({ ...editState, theme: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    <input
                      value={editState.target}
                      onChange={(e) => setEditState({ ...editState, target: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    <input
                      value={editState.urlOrMemo}
                      onChange={(e) => setEditState({ ...editState, urlOrMemo: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 border border-slate-200">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={saveEdit}
                        className="p-1 rounded text-green-600 hover:bg-green-100 transition"
                        title="保存"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 rounded text-slate-400 hover:bg-slate-100 transition"
                        title="キャンセル"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }

            // ── 通常行 ─────────────────────────────────────
            return (
              <tr
                key={item.id}
                className={cn(
                  'hover:bg-slate-50 transition',
                  isDeleting && 'opacity-40',
                )}
              >
                <td className="px-3 py-2.5 border border-slate-200 font-medium text-slate-800 max-w-[200px] truncate">
                  {item.title}
                </td>
                <td className="px-3 py-2.5 border border-slate-200">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {MAP_CONTENT_TYPE_LABELS[item.contentType]}
                  </span>
                </td>
                <td className="px-3 py-2.5 border border-slate-200">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', MAP_STATUS_COLORS[item.status])}>
                    {MAP_STATUS_LABELS[item.status]}
                  </span>
                </td>
                <td className="px-3 py-2.5 border border-slate-200 text-xs text-slate-600 max-w-[96px] truncate">
                  {item.symptom || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2.5 border border-slate-200 text-xs text-slate-600 max-w-[96px] truncate">
                  {item.theme || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2.5 border border-slate-200 text-xs text-slate-600 max-w-[96px] truncate">
                  {item.target || <span className="text-slate-300">—</span>}
                </td>
                <td className="px-3 py-2.5 border border-slate-200 text-xs text-slate-500 max-w-[112px] truncate">
                  {item.urlOrMemo ? (
                    item.urlOrMemo.startsWith('http') ? (
                      <a
                        href={item.urlOrMemo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                      >
                        <ExternalLink size={11} />リンク
                      </a>
                    ) : (
                      item.urlOrMemo
                    )
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 border border-slate-200">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => startEdit(item)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="編集"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={isDeleting}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
