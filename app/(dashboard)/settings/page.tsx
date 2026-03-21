'use client';

import { Settings, Building2, Info, Link2, Link2Off, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { useSession } from 'next-auth/react';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface ThreadsStatus {
  connected:      boolean;
  username?:      string;
  tokenExpiresAt?: string;
  isExpired?:     boolean;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">読み込み中...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { data: session }                                      = useSession();
  const { currentClinic, availableClinics, setClinic }        = useClinic();
  const color        = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');
  const searchParams = useSearchParams();

  // ── Threads 連携状態 ──────────────────────────────────
  const [threadsStatus,       setThreadsStatus]       = useState<ThreadsStatus | null>(null);
  const [threadsLoading,      setThreadsLoading]      = useState(false);
  const [threadsDisconnecting, setThreadsDisconnecting] = useState(false);
  const [threadsNotice,       setThreadsNotice]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchThreadsStatus = useCallback(async () => {
    if (!currentClinic) return;
    try {
      const res  = await fetch(`/api/threads/status?clinicId=${currentClinic.id}`);
      const data = await res.json();
      setThreadsStatus(data);
    } catch {
      setThreadsStatus({ connected: false });
    }
  }, [currentClinic]);

  useEffect(() => {
    fetchThreadsStatus();
  }, [fetchThreadsStatus]);

  // OAuth コールバック後の通知
  useEffect(() => {
    const result   = searchParams.get('threads');
    const username = searchParams.get('username');
    if (result === 'success') {
      setThreadsNotice({ type: 'success', msg: `@${username} として Threads に接続しました` });
      fetchThreadsStatus();
    } else if (result === 'error') {
      setThreadsNotice({ type: 'error', msg: '接続に失敗しました。再度お試しください。' });
    }
  }, [searchParams, fetchThreadsStatus]);

  async function handleThreadsConnect() {
    if (!currentClinic) return;
    setThreadsLoading(true);
    window.location.href = `/api/threads/connect?clinicId=${currentClinic.id}`;
  }

  async function handleThreadsDisconnect() {
    if (!currentClinic) return;
    setThreadsDisconnecting(true);
    try {
      await fetch(`/api/threads/disconnect?clinicId=${currentClinic.id}`, { method: 'DELETE' });
      setThreadsStatus({ connected: false });
      setThreadsNotice({ type: 'success', msg: 'Threads の連携を解除しました' });
    } finally {
      setThreadsDisconnecting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">設定</h1>
          <p className="text-sm text-slate-500">アカウントと院の設定</p>
        </div>
      </div>

      {/* アカウント情報 */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Info size={15} /> アカウント情報
        </h2>
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-slate-500">名前</dt>
            <dd className="font-medium text-slate-800">{session?.user?.name}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-slate-500">メールアドレス</dt>
            <dd className="font-medium text-slate-800">{session?.user?.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-slate-500">ロール</dt>
            <dd className="font-medium text-slate-800">
              {session?.user?.role === 'admin' ? '管理者' : 'スタッフ'}
            </dd>
          </div>
        </dl>
      </section>

      {/* 院の切り替え */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Building2 size={15} /> アクセス可能な院
        </h2>
        <div className="space-y-2">
          {availableClinics.map((clinic) => {
            const c        = getClinicColor(clinic.slug);
            const isActive = clinic.id === currentClinic?.id;
            return (
              <button
                key={clinic.id}
                onClick={() => setClinic(clinic)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition',
                  isActive
                    ? cn('border-current', c.text, 'bg-slate-50')
                    : 'border-slate-200 hover:border-slate-300',
                )}
              >
                <div className={cn('w-3 h-3 rounded-full', c.bg)} />
                <div>
                  <p className={cn('font-semibold text-sm', isActive ? 'text-slate-900' : 'text-slate-700')}>
                    {clinic.name}
                  </p>
                  <p className="text-xs text-slate-400">{clinic.slug}</p>
                </div>
                {isActive && (
                  <span className={cn('ml-auto text-xs font-medium px-2 py-1 rounded-full', c.badge)}>
                    現在選択中
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════ SNS 連携 ══════════════════════ */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Link2 size={15} /> SNS 連携
        </h2>

        {/* 通知バナー */}
        {threadsNotice && (
          <div className={cn(
            'flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4',
            threadsNotice.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700',
          )}>
            {threadsNotice.type === 'success'
              ? <CheckCircle2 size={15} />
              : <AlertCircle size={15} />}
            {threadsNotice.msg}
          </div>
        )}

        {/* Threads */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            {/* Threads ロゴ（SVG） */}
            <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
              <svg viewBox="0 0 192 192" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.347-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.452-15.153 9.879-25.93 5.943 3.578 10.337 8.3 12.767 13.896 4.134 9.467 4.373 25.006-8.546 37.932-11.319 11.325-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.741C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 9.986 15.846 12.8 26.21l16.147-4.317c-3.39-12.583-8.879-23.565-16.44-32.708C147.036 10.812 125.205 1.27 97.07 1.08h-.113C68.882 1.27 47.292 10.83 32.788 28.352 19.882 43.716 13.233 65.131 13.024 96v.065c.209 30.869 6.859 52.284 19.764 67.648 14.504 17.52 36.094 27.081 64.168 27.269h.108c24.922-.163 42.5-6.727 57.037-21.269 19.139-19.136 18.557-42.91 12.246-57.501-4.484-10.254-13.033-18.533-24.81-23.224Zm-43.16 40.947c-10.44.588-21.286-4.098-21.82-14.135-.397-7.442 5.296-15.746 22.461-16.735 1.966-.113 3.895-.169 5.79-.169 6.235 0 12.068.606 17.37 1.765-1.978 24.702-13.754 28.713-23.8 29.274Z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-800">Threads</p>
              {threadsStatus?.connected ? (
                <p className="text-xs text-green-600">
                  @{threadsStatus.username} で接続中
                  {threadsStatus.tokenExpiresAt && (
                    <span className="text-slate-400 ml-1">
                      （{new Date(threadsStatus.tokenExpiresAt).toLocaleDateString('ja-JP')} まで有効）
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-slate-400">未連携 — 接続するとコンテンツを直接投稿できます</p>
              )}
            </div>
          </div>

          {/* 接続 / 解除ボタン */}
          {threadsStatus?.connected ? (
            <button
              onClick={handleThreadsDisconnect}
              disabled={threadsDisconnecting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
            >
              {threadsDisconnecting
                ? <Loader2 size={14} className="animate-spin" />
                : <Link2Off size={14} />}
              解除
            </button>
          ) : (
            <button
              onClick={handleThreadsConnect}
              disabled={threadsLoading || !currentClinic}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition',
                threadsLoading || !currentClinic
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-black hover:bg-slate-800',
              )}
            >
              {threadsLoading
                ? <Loader2 size={14} className="animate-spin" />
                : <Link2 size={14} />}
              接続する
            </button>
          )}
        </div>

        {/* APIキー未設定の場合の注意 */}
        {!process.env.NEXT_PUBLIC_THREADS_APP_CONFIGURED && (
          <p className="mt-3 text-xs text-slate-400 flex items-start gap-1">
            <AlertCircle size={11} className="mt-0.5 shrink-0" />
            利用するには .env に THREADS_APP_ID と THREADS_APP_SECRET の設定が必要です
          </p>
        )}
      </section>

      {/* バージョン情報 */}
      <div className="text-center text-xs text-slate-400 mt-6">
        <p>ClinicMark v0.1.0 MVP</p>
        <p className="mt-1">患者個人情報は一切取り扱いません</p>
      </div>
    </div>
  );
}
