'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Instagram,
  Youtube,
  AtSign,
  MessageCircle,
  Plus,
  X,
  Sparkles,
  Send,
  FileText,
  Filter,
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';

/* ---------- 型定義 ---------- */
type Platform = 'instagram' | 'youtube' | 'threads' | 'line';
type PostStatus = 'draft' | 'scheduled' | 'published';
type PostType = 'feed' | 'stories' | 'reels' | 'short' | 'thread' | 'message' | 'other';

interface SnsPost {
  id: string;
  platforms: Platform[];
  postType: PostType;
  title: string;
  body: string;
  hashtags: string;
  status: PostStatus;
  scheduledAt: string;
  createdAt: string;
}

/* ---------- 定数 ---------- */
const PLATFORM_META: Record<Platform, { label: string; color: string; pillBg: string; icon: React.ElementType }> = {
  instagram: { label: 'Instagram', color: 'text-pink-600',   pillBg: 'bg-pink-100 text-pink-700',   icon: Instagram },
  youtube:   { label: 'YouTube',   color: 'text-red-600',    pillBg: 'bg-red-100 text-red-700',     icon: Youtube },
  threads:   { label: 'Threads',   color: 'text-slate-800',  pillBg: 'bg-slate-200 text-slate-800', icon: AtSign },
  line:      { label: 'LINE',      color: 'text-green-600',  pillBg: 'bg-green-100 text-green-700', icon: MessageCircle },
};

const PLATFORMS: Platform[] = ['instagram', 'youtube', 'threads', 'line'];

const POST_TYPE_LABELS: Record<PostType, string> = {
  feed: 'フィード',
  stories: 'ストーリーズ',
  reels: 'リール',
  short: 'ショート',
  thread: 'スレッド',
  message: 'メッセージ',
  other: 'その他',
};

const STATUS_STYLES: Record<PostStatus, { label: string; cls: string }> = {
  draft:     { label: '下書き',   cls: 'bg-slate-100 text-slate-600' },
  scheduled: { label: '予約済み', cls: 'bg-blue-100 text-blue-700' },
  published: { label: '投稿済み', cls: 'bg-green-100 text-green-700' },
};

const STORAGE_KEY = 'clinicmark_sns_posts';

/* ---------- ヘルパー ---------- */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function loadPosts(): SnsPost[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function savePosts(posts: SnsPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/* ---------- コンポーネント ---------- */
export default function SnsHubPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [posts, setPosts] = useState<SnsPost[]>([]);
  const [tabPlatform, setTabPlatform] = useState<Platform | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  // フォーム
  const [formPlatforms, setFormPlatforms] = useState<Platform[]>(['instagram']);
  const [formPostType, setFormPostType] = useState<PostType>('feed');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formHashtags, setFormHashtags] = useState('');
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const [formStatus, setFormStatus] = useState<PostStatus>('draft');

  useEffect(() => {
    setPosts(loadPosts());
  }, []);

  const persist = (updated: SnsPost[]) => {
    setPosts(updated);
    savePosts(updated);
  };

  const filtered = useMemo(
    () =>
      tabPlatform === 'all'
        ? posts
        : posts.filter((p) => p.platforms.includes(tabPlatform)),
    [posts, tabPlatform],
  );

  // ソート: 新しい順
  const sorted = useMemo(() => [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [filtered]);

  const togglePlatform = (pl: Platform) => {
    setFormPlatforms((prev) =>
      prev.includes(pl) ? prev.filter((p) => p !== pl) : [...prev, pl],
    );
  };

  const handleAdd = () => {
    if (!formTitle.trim() || formPlatforms.length === 0) return;
    const post: SnsPost = {
      id: generateId(),
      platforms: formPlatforms,
      postType: formPostType,
      title: formTitle.trim(),
      body: formBody,
      hashtags: formHashtags,
      status: formStatus,
      scheduledAt: formScheduledAt,
      createdAt: new Date().toISOString(),
    };
    persist([...posts, post]);
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    persist(posts.filter((p) => p.id !== id));
  };

  const resetForm = () => {
    setFormPlatforms(['instagram']);
    setFormPostType('feed');
    setFormTitle('');
    setFormBody('');
    setFormHashtags('');
    setFormScheduledAt('');
    setFormStatus('draft');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color.bg)}>
            <Send size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">SNS投稿ハブ</h1>
            <p className="text-sm text-slate-500">すべてのSNS投稿を一元管理</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white', color.bg)}
        >
          <Plus size={16} />
          新規投稿
        </button>
      </div>

      {/* プラットフォームタブ */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        <button
          onClick={() => setTabPlatform('all')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition',
            tabPlatform === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
          )}
        >
          <Filter size={14} />
          全て
          <span className="ml-1 text-xs opacity-70">({posts.length})</span>
        </button>
        {PLATFORMS.map((pl) => {
          const meta = PLATFORM_META[pl];
          const Icon = meta.icon;
          const count = posts.filter((p) => p.platforms.includes(pl)).length;
          return (
            <button
              key={pl}
              onClick={() => setTabPlatform(pl)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition',
                tabPlatform === pl
                  ? cn(meta.pillBg, 'border-transparent')
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
              )}
            >
              <Icon size={14} />
              {meta.label}
              <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 新規投稿フォーム */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">新規投稿を作成</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4">
            {/* プラットフォーム選択 */}
            <div>
              <label className="block text-sm text-slate-600 mb-2">プラットフォーム選択（複数可）</label>
              <div className="flex gap-2 flex-wrap">
                {PLATFORMS.map((pl) => {
                  const meta = PLATFORM_META[pl];
                  const Icon = meta.icon;
                  const selected = formPlatforms.includes(pl);
                  return (
                    <button
                      key={pl}
                      type="button"
                      onClick={() => togglePlatform(pl)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition',
                        selected
                          ? cn(meta.pillBg, 'border-transparent')
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50',
                      )}
                    >
                      <Icon size={14} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 投稿タイプ + ステータス */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">投稿タイプ</label>
                <select
                  value={formPostType}
                  onChange={(e) => setFormPostType(e.target.value as PostType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {Object.entries(POST_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">投稿日時</label>
                <input
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={(e) => setFormScheduledAt(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">ステータス</label>
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

            {/* タイトル */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">タイトル</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="投稿のタイトルを入力..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* テキスト本文 */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">テキスト本文</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="投稿する内容を入力..."
                rows={5}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* ハッシュタグ */}
            <div>
              <label className="block text-sm text-slate-600 mb-1">ハッシュタグ</label>
              <input
                type="text"
                value={formHashtags}
                onChange={(e) => setFormHashtags(e.target.value)}
                placeholder="#整体 #腰痛 #肩こり"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            {/* ボタン行 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAdd}
                disabled={!formTitle.trim() || formPlatforms.length === 0}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40',
                  color.bg,
                )}
              >
                <FileText size={16} />
                保存する
              </button>
              <Link
                href="/generate/multi"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <Sparkles size={16} />
                AIで生成
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 投稿一覧 */}
      {sorted.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <Send size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-400 mb-4">まだ投稿がありません</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className={cn('inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white', color.bg)}
          >
            <Plus size={16} />
            最初の投稿を作成
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((post) => {
            const statusStyle = STATUS_STYLES[post.status];
            return (
              <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* プラットフォームアイコン + タイトル */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex items-center gap-1">
                        {post.platforms.map((pl) => {
                          const Icon = PLATFORM_META[pl].icon;
                          return <Icon key={pl} size={14} className={PLATFORM_META[pl].color} />;
                        })}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{post.title}</h3>
                    </div>

                    {/* プレビュー */}
                    {post.body && (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{post.body}</p>
                    )}
                    {post.hashtags && (
                      <p className="text-xs text-blue-500 mb-2">{post.hashtags}</p>
                    )}

                    {/* バッジ + メタ */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {post.platforms.map((pl) => (
                        <span key={pl} className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', PLATFORM_META[pl].pillBg)}>
                          {PLATFORM_META[pl].label}
                        </span>
                      ))}
                      <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', statusStyle.cls)}>
                        {statusStyle.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{POST_TYPE_LABELS[post.postType]}</span>
                      {post.scheduledAt && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(post.scheduledAt).toLocaleString('ja-JP')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="text-slate-300 hover:text-red-500 transition flex-shrink-0 mt-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
