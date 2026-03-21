import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { ClinicSwitcher } from '@/components/layout/ClinicSwitcher';
import { MobileNavProvider } from '@/contexts/MobileNavContext';
import { MobileMenuButton } from '@/components/layout/MobileMenuButton';
import { IS_MOCK_MODE } from '@/lib/ai/client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 認証を一時的にバイパス（後で戻す）
  // const session = await getServerSession(authOptions);
  // if (!session) redirect('/login');

  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />

        {/* メインコンテンツ: モバイルは全幅、PC以上は左 240px 分オフセット */}
        <div className="md:ml-60 flex flex-col min-h-screen">
          {/* モックモードバナー */}
          {IS_MOCK_MODE && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-700 flex items-center gap-2">
              <span className="font-bold">🧪 モックモード</span>
              <span className="hidden sm:inline">ANTHROPIC_API_KEY 未設定のため、ダミーテキストで動作しています。</span>
            </div>
          )}

          {/* トップバー */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            {/* モバイル: ハンバーガーボタン / PC: 空スペース */}
            <MobileMenuButton />
            <div className="hidden md:block" />
            <ClinicSwitcher />
          </header>

          {/* ページコンテンツ */}
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </MobileNavProvider>
  );
}
