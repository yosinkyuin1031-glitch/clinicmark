'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, Instagram, Archive,
  Sparkles, TrendingUp, Clock, Megaphone, LayoutGrid, Video, AtSign,
  Youtube, CalendarDays, Image, Send,
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { useSession } from 'next-auth/react';
import { getClinicColor, cn, formatDate } from '@/lib/utils/clinic';
import { CONTENT_TYPE_LABELS, type GeneratedContent, type ContentType } from '@/types';

const QUICK_ACTIONS = [
  { href: '/generate/multi',     label: '一括生成',            icon: LayoutGrid,      desc: '複数SNSを一度にまとめて生成' },
  { href: '/generate/instagram', label: 'Instagram台本',      icon: Instagram,       desc: 'フィード・ストーリーズ台本' },
  { href: '/generate/video-ad',  label: '動画クリエイティブ',  icon: Video,           desc: 'Instagram・YouTube動画台本' },
  { href: '/generate/meta-ad',   label: 'Meta広告コピー',     icon: Megaphone,       desc: 'Facebook/Instagram 広告3案' },
  { href: '/generate/youtube',   label: 'YouTube台本',        icon: Youtube,         desc: 'YouTube動画の台本を自動生成' },
  { href: '/generate/image',     label: 'AI画像生成',          icon: Image,           desc: 'SNS投稿用の画像プロンプト' },
  { href: '/calendar',           label: '投稿カレンダー',      icon: CalendarDays,    desc: 'SNS投稿スケジュール管理' },
  { href: '/sns-hub',            label: 'SNS投稿ハブ',         icon: Send,            desc: '全SNSの投稿を一元管理' },
  { href: '/threads',            label: 'Threads自動投稿',    icon: AtSign,          desc: 'Threadsへの自動投稿管理' },
  { href: '/brand',              label: 'ブランド辞書',        icon: BookOpen,        desc: '院のブランド情報を管理' },
  { href: '/library',            label: 'コンテンツライブラリ', icon: Archive,        desc: '過去の生成物を確認' },
];

export default function DashboardPage() {
  const { data: session }   = useSession();
  const { currentClinic }   = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [recentContents, setRecentContents] = useState<GeneratedContent[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, draft: 0 });

  useEffect(() => {
    if (!currentClinic) return;
    fetch(`/api/content?clinicId=${currentClinic.id}&limit=5`)
      .then((r) => r.json())
      .then((json) => {
        setRecentContents(json.data ?? []);
        const total    = json.total ?? 0;
        const approved = (json.data ?? []).filter((c: GeneratedContent) => c.status === 'APPROVED').length;
        const draft    = (json.data ?? []).filter((c: GeneratedContent) => c.status === 'DRAFT').length;
        setStats({ total, approved, draft });
      });
  }, [currentClinic]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'おはようございます';
    if (h < 18) return 'こんにちは';
    return 'お疲れ様です';
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* ウェルカムヘッダー */}
      <div className={cn('rounded-2xl p-6 mb-6 text-white', color.bg)}>
        <p className="text-sm opacity-80 mb-1">{greeting()}、{session?.user?.name ?? 'スタッフ'}さん</p>
        <h1 className="text-2xl font-bold">
          {currentClinic ? currentClinic.name : 'ClinicMark'}
        </h1>
        <p className="text-sm opacity-70 mt-1">SNSマーケティング支援ツール</p>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
        {[
          { label: '総コンテンツ',   value: stats.total,    icon: TrendingUp },
          { label: '下書き',        value: stats.draft,    icon: Clock },
          { label: '確認済み',      value: stats.approved, icon: Sparkles },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 flex flex-col md:flex-row md:items-center md:gap-4">
            <div className={cn('hidden md:flex w-10 h-10 rounded-lg items-center justify-center bg-slate-100')}>
              <Icon size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* クイックアクション + 最近の生成物: モバイルは縦積み、LG以上は横並び */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* クイックアクション */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm hover:border-slate-300 transition group"
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition', color.bg, 'group-hover:opacity-90')}>
                  <Icon size={17} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* 最近の生成物 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">最近の生成物</h2>
            <Link href="/library" className={cn('text-xs font-medium', color.text)}>
              すべて見る →
            </Link>
          </div>

          {recentContents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-slate-400">
              <p className="text-sm">まだ生成履歴がありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentContents.map((c) => (
                <div key={c.id} className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 mb-0.5">
                    {CONTENT_TYPE_LABELS[c.type as ContentType] ?? c.type}
                  </p>
                  <p className="text-sm text-slate-800 truncate">{c.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDate(c.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
