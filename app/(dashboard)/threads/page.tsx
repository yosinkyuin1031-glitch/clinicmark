'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { AtSign, Send, Clock, CheckCircle2, XCircle, Trash2, Link2, Unlink } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';

interface Connection {
  id: string;
  username: string;
  expiresAt: string;
}

interface ScheduledPost {
  id: string;
  text: string;
  status: string;
  scheduledAt: string;
  publishedAt: string | null;
  errorLog: string;
  createdAt: string;
}

export default function ThreadsPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');
  const searchParams = useSearchParams();

  const [connection, setConnection] = useState<Connection | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const clinicId = currentClinic?.id;

  const fetchData = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);

    // 接続状況を取得
    const connRes = await fetch(`/api/threads/schedule?clinicId=${clinicId}&checkConnection=true`);
    // 予約投稿一覧を取得
    const postsRes = await fetch(`/api/threads/schedule?clinicId=${clinicId}`);
    const postsData = await postsRes.json();
    setPosts(Array.isArray(postsData) ? postsData : []);

    // 接続情報はAPIから取得
    try {
      const connCheckRes = await fetch(`/api/brand?clinicId=${clinicId}`);
      // connectionはseparateに取得する必要がある
    } catch {}

    setLoading(false);
  }, [clinicId]);

  // 接続状況を個別に取得
  useEffect(() => {
    if (!clinicId) return;
    fetch(`/api/threads/schedule?clinicId=${clinicId}`)
      .then(r => r.json())
      .then(data => {
        setPosts(Array.isArray(data) ? data : []);
      });
    // 接続情報チェック
    fetch(`/api/content?clinicId=${clinicId}&type=__threads_check__`)
      .then(() => {})
      .catch(() => {});
    setLoading(false);
  }, [clinicId]);

  // OAuth成功メッセージ
  const connected = searchParams.get('connected');
  const error = searchParams.get('error');

  // Threads連携開始
  const handleConnect = () => {
    if (!clinicId) return;
    window.location.href = `/api/threads/callback?start=true&state=${clinicId}`;
    // 実際はgetThreadsAuthUrlを使う。環境変数が設定されていない場合はアラート
    const appId = process.env.NEXT_PUBLIC_THREADS_APP_ID;
    if (!appId) {
      alert('Threads連携にはTHREADS_APP_IDの設定が必要です。設定画面から環境変数を確認してください。');
      return;
    }
    const redirectUri = `${window.location.origin}/api/threads/callback`;
    const scope = 'threads_basic,threads_content_publish';
    window.location.href = `https://threads.net/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${clinicId}`;
  };

  // 連携解除
  const handleDisconnect = async () => {
    if (!confirm('Threads連携を解除しますか？予約中の投稿もキャンセルされます。')) return;
    await fetch('/api/threads/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId }),
    });
    setConnection(null);
    window.location.reload();
  };

  // 予約投稿
  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicId || !newText.trim() || !scheduledAt) return;
    setSubmitting(true);
    try {
      await fetch('/api/threads/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId, text: newText, scheduledAt }),
      });
      setNewText('');
      setScheduledAt('');
      // 再読み込み
      const res = await fetch(`/api/threads/schedule?clinicId=${clinicId}`);
      setPosts(await res.json());
    } catch {
      alert('予約に失敗しました');
    }
    setSubmitting(false);
  };

  // 投稿キャンセル
  const handleCancel = async (id: string) => {
    if (!confirm('この予約をキャンセルしますか？')) return;
    await fetch(`/api/threads/posts?id=${id}`, { method: 'DELETE' });
    const res = await fetch(`/api/threads/schedule?clinicId=${clinicId}`);
    setPosts(await res.json());
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'FAILED': return <XCircle size={14} className="text-red-500" />;
      case 'CANCELLED': return <XCircle size={14} className="text-slate-400" />;
      case 'PROCESSING': return <Clock size={14} className="text-blue-500 animate-spin" />;
      default: return <Clock size={14} className="text-amber-500" />;
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return '投稿済み';
      case 'FAILED': return '失敗';
      case 'CANCELLED': return 'キャンセル';
      case 'PROCESSING': return '処理中';
      default: return '予約中';
    }
  };

  if (!clinicId) {
    return <div className="p-6 text-slate-500">院を選択してください</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color.bg)}>
          <AtSign size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Threads自動投稿</h1>
          <p className="text-sm text-slate-500">ブランド辞書を活用してThreadsに自動投稿</p>
        </div>
      </div>

      {/* 通知 */}
      {connected && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4 text-sm text-emerald-700">
          Threadsアカウントの連携が完了しました
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-700">
          連携に失敗しました。もう一度お試しください。
        </div>
      )}

      {/* 連携状態 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-bold text-slate-900 mb-3">アカウント連携</h2>
        <p className="text-sm text-slate-500 mb-4">
          Threadsアカウントを連携すると、予約投稿が自動で公開されます。
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleConnect}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white', color.bg)}
          >
            <Link2 size={16} />
            Threadsを連携する
          </button>
          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50"
          >
            <Unlink size={16} />
            連携解除
          </button>
        </div>
      </div>

      {/* 予約投稿フォーム */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-bold text-slate-900 mb-3">新しい投稿を予約</h2>
        <form onSubmit={handleSchedule} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">投稿テキスト</label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="投稿する内容を入力...&#10;&#10;ブランド辞書の内容を参考にして、一括生成やInstagram台本で作ったコンテンツをここに貼り付けることもできます。"
              required
            />
            <p className="text-xs text-slate-400 mt-1">{newText.length} / 500文字</p>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">投稿日時</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newText.trim() || !scheduledAt}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40',
              color.bg,
            )}
          >
            <Send size={16} />
            {submitting ? '予約中...' : '予約する'}
          </button>
        </form>
      </div>

      {/* 投稿履歴 */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-bold text-slate-900 mb-3">投稿履歴</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">まだ投稿はありません</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="border border-slate-100 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap flex-1">{post.text}</p>
                  {post.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(post.id)}
                      className="text-slate-400 hover:text-red-500 flex-shrink-0"
                      title="キャンセル"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    {statusIcon(post.status)}
                    {statusLabel(post.status)}
                  </span>
                  <span>予約: {new Date(post.scheduledAt).toLocaleString('ja-JP')}</span>
                  {post.publishedAt && (
                    <span>投稿: {new Date(post.publishedAt).toLocaleString('ja-JP')}</span>
                  )}
                </div>
                {post.status === 'FAILED' && post.errorLog && (
                  <p className="text-xs text-red-500 mt-1">エラー: {post.errorLog}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
