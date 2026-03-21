'use client';

import { useState } from 'react';
import { Loader2, Check, AlertCircle, X, Send, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';

interface Props {
  clinicId:  string;
  contentId: string;
  text:      string;       // 元のコンテンツ本文
  size?:     'sm' | 'md';
}

type ActiveTab = 'now' | 'schedule';

// ローカルの datetime-local 値から ISO 文字列に変換
function localDateTimeToISO(value: string): string {
  if (!value) return '';
  return new Date(value).toISOString();
}

// 今から最低 5 分後の datetime-local 初期値
function getDefaultScheduleValue(): string {
  const d = new Date(Date.now() + 5 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ThreadsPostButton({ clinicId, contentId, text, size = 'sm' }: Props) {
  const [open,        setOpen]        = useState(false);
  const [activeTab,   setActiveTab]   = useState<ActiveTab>('now');
  const [editText,    setEditText]    = useState('');
  const [scheduleAt,  setScheduleAt]  = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<'success' | 'error' | null>(null);
  const [errorMsg,    setErrorMsg]    = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');

  function openModal() {
    setEditText(text.slice(0, 500));
    setScheduleAt(getDefaultScheduleValue());
    setActiveTab('now');
    setResult(null);
    setErrorMsg('');
    setSuccessMsg('');
    setOpen(true);
  }

  // ── 今すぐ投稿 ────────────────────────────────────────
  async function handlePostNow() {
    if (!editText.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res  = await fetch('/api/threads/post', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ clinicId, contentId, text: editText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? '投稿に失敗しました');
        setResult('error');
      } else {
        setSuccessMsg('Threads に投稿しました！');
        setResult('success');
        setTimeout(() => setOpen(false), 2000);
      }
    } catch {
      setErrorMsg('ネットワークエラーが発生しました');
      setResult('error');
    } finally {
      setLoading(false);
    }
  }

  // ── 予約投稿 ──────────────────────────────────────────
  async function handleSchedule() {
    if (!editText.trim() || !scheduleAt) return;
    setLoading(true);
    setResult(null);
    try {
      const iso = localDateTimeToISO(scheduleAt);
      const res = await fetch('/api/threads/scheduled', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          clinicId,
          content:     editText.trim(),
          scheduledAt: iso,
          contentId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? '予約に失敗しました');
        setResult('error');
      } else {
        const d = new Date(scheduleAt);
        const label = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        setSuccessMsg(`${label} に予約しました！`);
        setResult('success');
        setTimeout(() => setOpen(false), 2500);
      }
    } catch {
      setErrorMsg('ネットワークエラーが発生しました');
      setResult('error');
    } finally {
      setLoading(false);
    }
  }

  const remaining = 500 - editText.length;

  // Threads アイコン SVG
  const threadsSvg = (w: number, h: number, fill = 'currentColor') => (
    <svg viewBox="0 0 192 192" width={w} height={h} fill={fill} xmlns="http://www.w3.org/2000/svg">
      <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.347-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.452-15.153 9.879-25.93 5.943 3.578 10.337 8.3 12.767 13.896 4.134 9.467 4.373 25.006-8.546 37.932-11.319 11.325-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.741C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 9.986 15.846 12.8 26.21l16.147-4.317c-3.39-12.583-8.879-23.565-16.44-32.708C147.036 10.812 125.205 1.27 97.07 1.08h-.113C68.882 1.27 47.292 10.83 32.788 28.352 19.882 43.716 13.233 65.131 13.024 96v.065c.209 30.869 6.859 52.284 19.764 67.648 14.504 17.52 36.094 27.081 64.168 27.269h.108c24.922-.163 42.5-6.727 57.037-21.269 19.139-19.136 18.557-42.91 12.246-57.501-4.484-10.254-13.033-18.533-24.81-23.224Zm-43.16 40.947c-10.44.588-21.286-4.098-21.82-14.135-.397-7.442 5.296-15.746 22.461-16.735 1.966-.113 3.895-.169 5.79-.169 6.235 0 12.068.606 17.37 1.765-1.978 24.702-13.754 28.713-23.8 29.274Z"/>
    </svg>
  );

  return (
    <>
      {/* トリガーボタン */}
      <button
        onClick={openModal}
        title="Threads に投稿"
        className={cn(
          'flex items-center gap-1 rounded-lg font-medium transition',
          size === 'sm'
            ? 'p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100'
            : 'px-3 py-1.5 text-sm text-white bg-black hover:bg-slate-800',
        )}
      >
        {threadsSvg(size === 'sm' ? 14 : 16, size === 'sm' ? 14 : 16)}
        {size === 'md' && 'Threads に投稿'}
      </button>

      {/* モーダル */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* モーダルヘッダー */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                  {threadsSvg(16, 16, 'white')}
                </div>
                <p className="font-semibold text-slate-800">Threads に投稿</p>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            {/* タブ */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => { setActiveTab('now'); setResult(null); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition',
                  activeTab === 'now'
                    ? 'text-slate-900 border-b-2 border-slate-900'
                    : 'text-slate-400 hover:text-slate-600',
                )}
              >
                <Send size={13} /> 今すぐ投稿
              </button>
              <button
                onClick={() => { setActiveTab('schedule'); setResult(null); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition',
                  activeTab === 'schedule'
                    ? 'text-slate-900 border-b-2 border-slate-900'
                    : 'text-slate-400 hover:text-slate-600',
                )}
              >
                <Clock size={13} /> 予約投稿
              </button>
            </div>

            {/* テキスト編集エリア */}
            <div className="p-5">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value.slice(0, 500))}
                rows={5}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="投稿内容を入力..."
                disabled={loading || result === 'success'}
              />
              <div className={cn(
                'text-right text-xs mt-1',
                remaining < 50 ? 'text-red-500' : 'text-slate-400',
              )}>
                残り {remaining} 文字
              </div>

              {/* 予約日時ピッカー */}
              {activeTab === 'schedule' && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">
                    投稿日時
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    min={getDefaultScheduleValue()}
                    disabled={loading || result === 'success'}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
                  />
                </div>
              )}

              {/* 結果通知 */}
              {result === 'success' && (
                <div className="flex items-center gap-2 mt-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
                  <Check size={15} /> {successMsg}
                </div>
              )}
              {result === 'error' && (
                <div className="flex items-start gap-2 mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> {errorMsg}
                </div>
              )}
            </div>

            {/* アクションボタン */}
            {result !== 'success' && (
              <div className="flex gap-2 px-5 pb-5">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  キャンセル
                </button>
                {activeTab === 'now' ? (
                  <button
                    onClick={handlePostNow}
                    disabled={loading || !editText.trim() || remaining < 0}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition',
                      loading || !editText.trim() || remaining < 0
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-black hover:bg-slate-800',
                    )}
                  >
                    {loading
                      ? <><Loader2 size={14} className="animate-spin" />投稿中...</>
                      : <><Send size={14} />投稿する</>}
                  </button>
                ) : (
                  <button
                    onClick={handleSchedule}
                    disabled={loading || !editText.trim() || !scheduleAt || remaining < 0}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition',
                      loading || !editText.trim() || !scheduleAt || remaining < 0
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-black hover:bg-slate-800',
                    )}
                  >
                    {loading
                      ? <><Loader2 size={14} className="animate-spin" />予約中...</>
                      : <><Clock size={14} />予約する</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
