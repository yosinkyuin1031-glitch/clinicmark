'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen, FileText, Instagram, Archive,
  Sparkles, TrendingUp, Clock, Megaphone, LayoutTemplate, LayoutGrid,
  CheckCircle2, ThumbsUp, MessageCircle, FileImage, GitBranch, Layers,
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { useSession } from 'next-auth/react';
import { getClinicColor, cn, formatDate } from '@/lib/utils/clinic';
import { CONTENT_TYPE_LABELS, type GeneratedContent, type ContentType } from '@/types';

interface Stats {
  total:     number;
  byStatus:  Record<string, number>;
  byType:    Record<string, number>;
  totalGood: number;
  totalBad:  number;
}

const QUICK_ACTIONS = [
  { href: '/generate/multi',           label: '一括生成',            icon: LayoutGrid,     desc: '複数媒体を一度にまとめて生成', badge: '人気' },
  { href: '/generate/faq',             label: 'FAQ・症状ページ',    icon: FileText,       desc: 'SEO対応の症状ページを作成',    badge: null },
  { href: '/generate/instagram',       label: 'Instagram台本',      icon: Instagram,      desc: 'フィード・ストーリーズ台本',    badge: null },
  { href: '/generate/instagram-story', label: 'ストーリーズ',        icon: Layers,         desc: 'スライド形式ストーリーズ台本', badge: null },
  { href: '/generate/campaign',        label: '訴求軸別広告',        icon: Megaphone,      desc: '訴求軸ごとの広告・LP素材',     badge: null },
  { href: '/generate/lp',              label: 'LPセクション',       icon: LayoutTemplate, desc: 'LP各セクションの原稿を作成',   badge: null },
  { href: '/line/templates',           label: 'LINEテンプレート',   icon: MessageCircle,  desc: '返信・案内文を管理',            badge: null },
  { href: '/flyers',                   label: 'チラシ管理',          icon: FileImage,      desc: 'チラシコピー生成＋保存',        badge: null },
  { href: '/brand',                    label: 'ブランド辞書',        icon: BookOpen,       desc: '院のブランド情報を管理',        badge: null },
];

const STATUS_DOT: Record<string, string> = {
  APPROVED: 'bg-emerald-400',
  DRAFT:    'bg-amber-400',
  ARCHIVED: 'bg-slate-400',
};

const STATUS_LABEL: Record<string, string> = {
  APPROVED: '承認済',
  DRAFT:    '下書き',
  ARCHIVED: 'アーカイブ',
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [recentContents, setRecentContents] = useState<GeneratedContent[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, byStatus: {}, byType: {}, totalGood: 0, totalBad: 0,
  });

  useEffect(() => {
    if (!currentClinic) return;
    Promise.all([
      fetch(`/api/content/stats?clinicId=${currentClinic.id}`).then((r) => r.json()),
      fetch(`/api/content?clinicId=${currentClinic.id}&limit=6`).then((r) => r.json()),
    ])
      .then(([statsJson, contentsJson]) => {
        setStats({
          total:     statsJson.total     ?? 0,
          byStatus:  statsJson.byStatus  ?? {},
          byType:    statsJson.byType    ?? {},
          totalGood: statsJson.totalGood ?? 0,
          totalBad:  statsJson.totalBad  ?? 0,
        });
        setRecentContents(contentsJson.data ?? []);
      })
      .catch(() => {});
  }, [currentClinic]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'おはようございます';
    if (h < 18) return 'こんにちは';
    return 'お疲れ様です';
  };

  const topTypes = Object.entries(stats.byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  const maxTypeCount = topTypes[0]?.[1] ?? 1;

  return (
    <div className="max-w-5xl mx-auto">
      {/* ウェルカムヘッダー */}
      <div className={cn('rounded-2xl p-6 mb-6 text-white', color.bg)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-80 mb-1">{greeting()}、{session?.user?.name ?? 'スタッフ'}さん</p>
            <h1 className="text-2xl font-bold">
              {currentClinic ? currentClinic.name : 'ClinicMark'}
            </h1>
            <p className="text-sm opacity-70 mt-1">院内マーケティング支援ツール</p>
          </div>
          {stats.totalGood > 0 && (
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5 text-xs font-medium">
              <Sparkles size={11} />
              AI学習済 {stats.totalGood}件
            </div>
          )}
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '総コンテンツ', value: stats.total,                     icon: TrendingUp,  colorCls: 'bg-slate-100 text-slate-500' },
          { label: '下書き',       value: stats.byStatus.DRAFT    ?? 0,    icon: Clock,       colorCls: 'bg-amber-50 text-amber-500' },
          { label: '承認済み',     value: stats.byStatus.APPROVED ?? 0,    icon: CheckCircle2,colorCls: 'bg-emerald-50 text-emerald-500' },
          { label: '高評価',       value: stats.totalGood,                 icon: ThumbsUp,    colorCls: 'bg-violet-50 text-violet-500' },
        ].map(({ label, value, icon: Icon, colorCls }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', colorCls)}>
              <Icon size={17} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* クイックアクション + サイドコラム */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* クイックアクション */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">クイックアクション</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_ACTIONS.map(({ href, label, icon: Icon, desc, badge }) => (
              <Link
                key={href}
                href={href}
                className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm hover:border-slate-300 transition group relative"
              >
                {badge && (
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5">
                    {badge}
                  </span>
                )}
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition', color.bg, 'group-hover:opacity-90')}>
                  <Icon size={17} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* サイドコラム */}
        <div className="space-y-4">
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
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_DOT[c.status] ?? 'bg-slate-300')} />
                      <p className="text-xs font-medium text-slate-500">
                        {CONTENT_TYPE_LABELS[c.type as ContentType] ?? c.type}
                      </p>
                      {c.rating === 'good' && <ThumbsUp size={10} className="text-emerald-400 ml-auto" />}
                      {c.rating === 'bad'  && <GitBranch size={10} className="text-red-400 ml-auto" />}
                    </div>
                    <p className="text-sm text-slate-800 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(c.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* コンテンツ種別内訳 */}
          {topTypes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">種別内訳 Top 5</h2>
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                {topTypes.map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 truncate max-w-[160px]">
                        {CONTENT_TYPE_LABELS[type as ContentType] ?? type}
                      </span>
                      <span className="text-slate-400 font-medium ml-2">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', color.bg)}
                        style={{ width: `${(count / maxTypeCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ライブラリへのリンク */}
          <Link
            href="/library"
            className="flex items-center gap-2 w-full bg-white border border-slate-200 rounded-xl px-4 py-3 hover:shadow-sm hover:border-slate-300 transition text-sm text-slate-700 font-medium"
          >
            <Archive size={15} className="text-slate-400" />
            コンテンツライブラリを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
