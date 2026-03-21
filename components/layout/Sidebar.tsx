'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Instagram,
  Megaphone,
  LayoutTemplate,
  Archive,
  Settings,
  LogOut,
  X,
  LayoutGrid,
  Images,
  Target,
  ImagePlay,
  NotebookPen,
  SearchCheck,
  Map,
  MessageCircle,
  GitBranch,
  FileImage,
  Mic2,
  Video,
  Star,
  Voicemail,
  UserRound,
  Wand2,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useClinic } from '@/contexts/ClinicContext';
import { useMobileNav } from '@/contexts/MobileNavContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';

const NAV_ITEMS = [
  { href: '/',                       label: 'ダッシュボード',        icon: LayoutDashboard, group: null },
  { href: '/brand',                  label: 'ブランド辞書',          icon: BookOpen,        group: null },
  { href: '/generate/multi',         label: '一括生成',              icon: LayoutGrid,      group: 'コンテンツ生成' },
  { href: '/generate/faq',           label: 'FAQ・症状ページ',       icon: FileText,        group: 'コンテンツ生成' },
  { href: '/generate/instagram',       label: 'Instagram台本',         icon: Instagram,       group: 'コンテンツ生成' },
  { href: '/generate/instagram-story', label: 'Instagramストーリーズ', icon: Images,          group: 'コンテンツ生成' },
  { href: '/generate/meta-ad',         label: 'Meta広告コピー',        icon: Megaphone,       group: 'コンテンツ生成' },
  { href: '/generate/campaign',        label: '訴求軸別広告・LP',      icon: Target,          group: 'コンテンツ生成' },
  { href: '/generate/lp',            label: 'LPセクション',          icon: LayoutTemplate,  group: 'コンテンツ生成' },
  { href: '/generate/image-prompt',   label: '画像指示文',            icon: ImagePlay,       group: 'コンテンツ生成' },
  { href: '/generate/patient-voice',  label: '患者の声から生成',      icon: Mic2,            group: 'コンテンツ生成' },
  { href: '/generate/video-ad',       label: '動画広告クリエイティブ', icon: Video,           group: 'コンテンツ生成' },
  { href: '/generate/note',          label: 'note下書き生成',         icon: NotebookPen,     group: 'コンテンツ生成' },
  { href: '/tools/competitor',        label: '競合分析',              icon: SearchCheck,     group: 'ツール' },
  { href: '/tools/review',            label: '口コミ収集QR',          icon: Star,            group: 'ツール' },
  { href: '/tools/voice-input',       label: '音声文字起こし',        icon: Voicemail,       group: 'ツール' },
  { href: '/tools/image-remix',       label: '画像リミックス',        icon: Wand2,           group: 'ツール' },
  { href: '/line/templates',         label: 'LINEテンプレート',      icon: MessageCircle,   group: 'LINE・集客' },
  { href: '/line/steps',             label: 'ステップ配信',          icon: GitBranch,       group: 'LINE・集客' },
  { href: '/line/personal',          label: '患者別カスタマイズLINE', icon: UserRound,       group: 'LINE・集客' },
  { href: '/flyers',                 label: 'チラシ管理',            icon: FileImage,       group: 'LINE・集客' },
  { href: '/library',                label: 'コンテンツライブラリ',  icon: Archive,         group: '管理' },
  { href: '/content-map',            label: 'コンテンツ管理マップ',  icon: Map,             group: '管理' },
  { href: '/settings',               label: '設定',                  icon: Settings,        group: null },
];

export function Sidebar() {
  const pathname          = usePathname();
  const { currentClinic } = useClinic();
  const { isOpen, close } = useMobileNav();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  return (
    <>
      {/* モバイルオーバーレイ (バックドロップ) */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-30 md:hidden transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={close}
        aria-hidden="true"
      />

      {/* サイドバー本体 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-200 flex flex-col z-40',
          'transition-transform duration-200 ease-in-out',
          // モバイル: 閉じている時は左へ隠す / PCは常に表示
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* ロゴ */}
        <div className="h-16 flex items-center px-5 border-b border-slate-200">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-sm', color.bg)}>
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-lg font-bold text-slate-900 flex-1">ClinicMark</span>
          {/* モバイル: 閉じるボタン */}
          <button
            onClick={close}
            className="md:hidden p-1 rounded text-slate-400 hover:text-slate-600 transition"
            aria-label="メニューを閉じる"
          >
            <X size={18} />
          </button>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon, group }, idx) => {
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname.startsWith(href);
            // グループラベルを最初の該当アイテムの前に表示
            const prevGroup = idx > 0 ? NAV_ITEMS[idx - 1].group : undefined;
            const showGroupLabel = group && group !== prevGroup;

            return (
              <div key={href}>
                {showGroupLabel && (
                  <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {group}
                  </p>
                )}
                <Link
                  href={href}
                  onClick={close}   /* モバイルでリンク押したら閉じる */
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition mb-0.5',
                    isActive
                      ? cn('text-white shadow-sm', color.bg)
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <Icon size={17} />
                  <span>{label}</span>
                </Link>
              </div>
            );
          })}
        </nav>

        {/* ログアウト */}
        <div className="px-3 pb-4 border-t border-slate-100 pt-3">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut size={17} />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>
    </>
  );
}
