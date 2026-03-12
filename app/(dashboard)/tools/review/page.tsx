'use client';

import { useState, useEffect } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { Star, Copy, Check, Loader2, ExternalLink, RefreshCw, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import { getClinicColor } from '@/lib/utils/clinic';

interface ReviewConfig {
  clinicName:           string;
  clinicSlug:           string;
  googleUrl:            string;
  hotpepperUrl:         string;
  positiveThreshold:    number;
  guidancePositive:     string;
  guidanceHotpepper:    string;
  guidanceNegative:     string;
  pageTitle:            string;
  satisfactionQuestion: string;
  reviewPageUrl:        string;
  qrUrl:                string;
  updatedAt:            string;
}

export default function ReviewToolPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [googleUrl,         setGoogleUrl]         = useState('');
  const [hotpepperUrl,      setHotpepperUrl]      = useState('');
  const [positiveThreshold, setPositiveThreshold] = useState(4);
  const [isLoading,         setIsLoading]         = useState(false);
  const [isFetching,        setIsFetching]        = useState(true);
  const [config,            setConfig]            = useState<ReviewConfig | null>(null);
  const [error,             setError]             = useState('');
  const [copiedUrl,         setCopiedUrl]         = useState(false);

  // 既存設定を取得
  useEffect(() => {
    if (!currentClinic) return;
    setIsFetching(true);
    fetch(`/api/tools/review?clinicId=${currentClinic.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.data) {
          setConfig(d.data);
          setGoogleUrl(d.data.googleUrl ?? '');
          setHotpepperUrl(d.data.hotpepperUrl ?? '');
          setPositiveThreshold(d.data.positiveThreshold ?? 4);
        }
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [currentClinic]);

  const handleSave = async (regenerate = false) => {
    if (!currentClinic) return;
    if (!googleUrl.trim()) { setError('Google口コミURLを入力してください'); return; }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/tools/review', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          clinicId: currentClinic.id,
          googleUrl,
          hotpepperUrl,
          positiveThreshold,
          regenerate,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '保存に失敗しました'); return; }
      setConfig(data.data);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const copyUrl = async () => {
    if (!config) return;
    const fullUrl = `${window.location.origin}${config.reviewPageUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', color.bg)}>
          <Star size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">口コミ収集QRコード</h1>
          <p className="text-sm text-slate-500">
            施術後に患者さんに見せる口コミ誘導ページを設定します。満足度に応じてGoogle・ホットペッパーへ振り分けます
          </p>
        </div>
      </div>

      {isFetching ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={28} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── 設定フォーム ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-slate-700 text-sm">基本設定</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Google マップ 口コミURL <span className="text-red-500">*</span>
                </label>
                <input
                  value={googleUrl}
                  onChange={e => setGoogleUrl(e.target.value)}
                  placeholder="https://g.page/r/..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Google マップでご自身の院を検索 → 「クチコミを書く」のリンクをコピー
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ホットペッパー 口コミURL（任意）
                </label>
                <input
                  value={hotpepperUrl}
                  onChange={e => setHotpepperUrl(e.target.value)}
                  placeholder="https://beauty.hotpepper.jp/..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Googleに誘導する評価スコアの閾値（{positiveThreshold}以上でGoogle誘導）
                </label>
                <input
                  type="range"
                  min={3} max={5} step={1}
                  value={positiveThreshold}
                  onChange={e => setPositiveThreshold(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>⭐⭐⭐</span>
                  <span>⭐⭐⭐⭐</span>
                  <span>⭐⭐⭐⭐⭐</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {positiveThreshold}点以上 → Google/ホットペッパーへ / {positiveThreshold - 1}点以下 → 院への直接フィードバックへ
                </p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={isLoading}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition',
                  isLoading ? 'bg-slate-300 cursor-not-allowed' : cn('hover:opacity-90', color.bg),
                )}
              >
                {isLoading
                  ? <><Loader2 size={14} className="animate-spin" />保存中...</>
                  : config ? '設定を更新' : 'ページを作成'}
              </button>
              {config && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={isLoading}
                  title="案内文を再生成"
                  className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
          </div>

          {/* ── プレビュー & QR ── */}
          <div className="space-y-4">
            {config ? (
              <>
                {/* QR */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h2 className="font-semibold text-slate-700 text-sm">QRコード・URL</h2>

                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={config.qrUrl}
                      alt="口コミ収集QR"
                      className="w-28 h-28 rounded-lg border border-slate-100 shadow-sm"
                    />
                    <div className="flex-1 space-y-2">
                      <p className="text-xs text-slate-500">
                        このQRコードを院内に掲示したり、施術後に患者さんに見せてください
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={copyUrl}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600"
                        >
                          {copiedUrl
                            ? <><Check size={12} className="text-green-600" />コピー済</>
                            : <><Copy size={12} />URLをコピー</>}
                        </button>
                        <a
                          href={config.reviewPageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600"
                        >
                          <ExternalLink size={12} />
                          プレビュー
                        </a>
                      </div>
                      <p className="text-xs text-slate-400 font-mono break-all">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}${config.reviewPageUrl}`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 案内文プレビュー */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                  <h2 className="font-semibold text-slate-700 text-sm">案内文プレビュー</h2>

                  <div>
                    <p className="text-xs font-medium text-emerald-600 mb-1">✅ 満足（{config.positiveThreshold}点以上）の場合</p>
                    <div className="bg-emerald-50 rounded-lg px-3 py-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {config.guidancePositive}
                    </div>
                  </div>

                  {config.guidanceHotpepper && (
                    <div>
                      <p className="text-xs font-medium text-red-500 mb-1">🍀 ホットペッパー誘導文</p>
                      <div className="bg-red-50 rounded-lg px-3 py-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                        {config.guidanceHotpepper}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">💬 不満（{config.positiveThreshold - 1}点以下）の場合</p>
                    <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {config.guidanceNegative}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <QrCode size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Google URLを入力してページを作成してください</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
