'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Calendar,
  Instagram,
  Youtube,
  AtSign,
  MessageCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';

/* ---------- 型定義 ---------- */
type Platform = 'instagram' | 'youtube' | 'threads' | 'line';
type PostStatus = 'draft' | 'scheduled' | 'published';

interface CalendarPost {
  id: string;
  date: string;          // YYYY-MM-DD
  platform: Platform;
  title: string;
  status: PostStatus;
  time?: string;         // HH:mm
}

/* ---------- 定数 ---------- */
const PLATFORM_META: Record<Platform, { label: string; color: string; pillBg: string; icon: React.ElementType }> = {
  instagram: { label: 'Instagram', color: 'text-pink-600',   pillBg: 'bg-pink-100 text-pink-700',     icon: Instagram },
  youtube:   { label: 'YouTube',   color: 'text-red-600',    pillBg: 'bg-red-100 text-red-700',       icon: Youtube },
  threads:   { label: 'Threads',   color: 'text-slate-800',  pillBg: 'bg-slate-200 text-slate-800',   icon: AtSign },
  line:      { label: 'LINE',      color: 'text-green-600',  pillBg: 'bg-green-100 text-green-700',   icon: MessageCircle },
};

const PLATFORMS: Platform[] = ['instagram', 'youtube', 'threads', 'line'];
const STORAGE_KEY = 'clinicmark_calendar';
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/* ---------- ヘルパー ---------- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadPosts(): CalendarPost[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePosts(posts: CalendarPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/* ---------- コンポーネント ---------- */
export default function CalendarPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // 新規投稿フォーム
  const [showForm, setShowForm] = useState(false);
  const [formPlatform, setFormPlatform] = useState<Platform>('instagram');
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('12:00');
  const [formStatus, setFormStatus] = useState<PostStatus>('scheduled');

  // 初回読み込み
  useEffect(() => {
    setPosts(loadPosts());
  }, []);

  // 保存
  const persist = useCallback((updated: CalendarPost[]) => {
    setPosts(updated);
    savePosts(updated);
  }, []);

  // フィルタ済み投稿
  const filtered = useMemo(
    () => (filterPlatform === 'all' ? posts : posts.filter((p) => p.platform === filterPlatform)),
    [posts, filterPlatform],
  );

  // 月間マップ
  const postsByDate = useMemo(() => {
    const map: Record<string, CalendarPost[]> = {};
    for (const p of filtered) map[p.date] = [...(map[p.date] || []), p];
    return map;
  }, [filtered]);

  // 統計
  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const monthPosts = useMemo(
    () => posts.filter((p) => p.date.startsWith(monthKey)),
    [posts, monthKey],
  );
  const platformCounts = useMemo(() => {
    const c: Record<Platform, number> = { instagram: 0, youtube: 0, threads: 0, line: 0 };
    monthPosts.forEach((p) => c[p.platform]++);
    return c;
  }, [monthPosts]);

  // ナビ
  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  // 投稿追加
  const handleAdd = () => {
    if (!formTitle.trim() || !selectedDate) return;
    const newPost: CalendarPost = {
      id: generateId(),
      date: selectedDate,
      platform: formPlatform,
      title: formTitle.trim(),
      status: formStatus,
      time: formTime,
    };
    persist([...posts, newPost]);
    setFormTitle('');
    setShowForm(false);
  };

  // 投稿削除
  const handleDelete = (id: string) => {
    persist(posts.filter((p) => p.id !== id));
  };

  // カレンダーグリッド
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedPosts = selectedDate ? (postsByDate[selectedDate] || []) : [];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color.bg)}>
          <Calendar size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">SNS投稿カレンダー</h1>
          <p className="text-sm text-slate-500">投稿スケジュールをカレンダーで管理</p>
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <p className="text-2xl font-bold text-slate-900">{monthPosts.length}</p>
          <p className="text-xs text-slate-500">今月の投稿数</p>
        </div>
        {PLATFORMS.map((pl) => {
          const meta = PLATFORM_META[pl];
          const Icon = meta.icon;
          return (
            <div key={pl} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2">
              <Icon size={16} className={meta.color} />
              <div>
                <p className="text-lg font-bold text-slate-900">{platformCounts[pl]}</p>
                <p className="text-xs text-slate-500">{meta.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* フィルタ + ナビ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-bold text-slate-900 min-w-[140px] text-center">
            {viewYear}年{viewMonth + 1}月
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterPlatform('all')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition',
              filterPlatform === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
            )}
          >
            全て
          </button>
          {PLATFORMS.map((pl) => {
            const meta = PLATFORM_META[pl];
            const Icon = meta.icon;
            return (
              <button
                key={pl}
                onClick={() => setFilterPlatform(pl)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition',
                  filterPlatform === pl
                    ? cn(meta.pillBg, 'border-transparent')
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                )}
              >
                <Icon size={12} />
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={cn(
                'text-center text-xs font-medium py-2',
                i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-500',
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 日付セル */}
        <div className="grid grid-cols-7">
          {/* 空セル */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px] border-b border-r border-slate-50" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateKey = toDateKey(viewYear, viewMonth, day);
            const dayPosts = postsByDate[dateKey] || [];
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDate;
            const dayOfWeek = (firstDay + i) % 7;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateKey)}
                className={cn(
                  'min-h-[80px] md:min-h-[100px] border-b border-r border-slate-50 p-1 cursor-pointer transition hover:bg-slate-50',
                  isSelected && 'bg-blue-50 ring-2 ring-blue-300 ring-inset',
                )}
              >
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full',
                    isToday && cn(color.bg, 'text-white'),
                    !isToday && dayOfWeek === 0 && 'text-red-500',
                    !isToday && dayOfWeek === 6 && 'text-blue-500',
                    !isToday && dayOfWeek !== 0 && dayOfWeek !== 6 && 'text-slate-700',
                  )}
                >
                  {day}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayPosts.slice(0, 3).map((p) => {
                    const meta = PLATFORM_META[p.platform];
                    return (
                      <div
                        key={p.id}
                        className={cn('truncate text-[10px] leading-tight px-1 py-0.5 rounded', meta.pillBg)}
                      >
                        {p.title}
                      </div>
                    );
                  })}
                  {dayPosts.length > 3 && (
                    <p className="text-[10px] text-slate-400 px-1">+{dayPosts.length - 3}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 選択日パネル */}
      {selectedDate && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">
              {selectedDate.replace(/-/g, '/')} の投稿
            </h2>
            <button
              onClick={() => { setShowForm(true); }}
              className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white', color.bg)}
            >
              <Plus size={16} />
              追加
            </button>
          </div>

          {/* 追加フォーム */}
          {showForm && (
            <div className="border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">新しい投稿</span>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">プラットフォーム</label>
                  <select
                    value={formPlatform}
                    onChange={(e) => setFormPlatform(e.target.value as Platform)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {PLATFORMS.map((pl) => (
                      <option key={pl} value={pl}>{PLATFORM_META[pl].label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">時間</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">ステータス</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as PostStatus)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="draft">下書き</option>
                    <option value="scheduled">予約済み</option>
                    <option value="published">投稿済み</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">タイトル</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="投稿タイトルを入力..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={!formTitle.trim()}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40',
                  color.bg,
                )}
              >
                追加する
              </button>
            </div>
          )}

          {/* 投稿一覧 */}
          {selectedPosts.length === 0 && !showForm ? (
            <p className="text-sm text-slate-400 py-4 text-center">この日の投稿はありません</p>
          ) : (
            <div className="space-y-2">
              {selectedPosts.map((p) => {
                const meta = PLATFORM_META[p.platform];
                const Icon = meta.icon;
                return (
                  <div key={p.id} className="flex items-center justify-between border border-slate-100 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <Icon size={16} className={meta.color} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', meta.pillBg)}>
                            {meta.label}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium',
                              p.status === 'draft' && 'bg-slate-100 text-slate-600',
                              p.status === 'scheduled' && 'bg-blue-100 text-blue-700',
                              p.status === 'published' && 'bg-green-100 text-green-700',
                            )}
                          >
                            {p.status === 'draft' ? '下書き' : p.status === 'scheduled' ? '予約済み' : '投稿済み'}
                          </span>
                          {p.time && <span className="text-[10px] text-slate-400">{p.time}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                      className="text-slate-300 hover:text-red-500 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
