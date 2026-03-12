'use client';

import { useState } from 'react';
import { Megaphone, Sparkles, AlertCircle } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { OutputPreview } from '@/components/generate/OutputPreview';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import type { GeneratedContent } from '@/types';

const AD_TYPES = ['リード獲得', 'ブランド認知', '来院促進', 'リターゲティング'] as const;

export default function MetaAdPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [theme,   setTheme]   = useState('');
  const [adType,  setAdType]  = useState<string>('リード獲得');
  const [target,  setTarget]  = useState('');
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{
    content: GeneratedContent;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
  } | null>(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!currentClinic || !theme.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate/meta-ad', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: currentClinic.id,
          theme:    theme.trim(),
          adType,
          target:   target.trim(),
          service:  service.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? '生成に失敗しました');
      }

      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  if (!currentClinic) {
    return <div className="flex items-center justify-center h-64 text-slate-400">院を選択してください</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
          <Megaphone size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Meta広告コピー生成</h1>
          <p className="text-sm text-slate-500">Facebook・Instagram 広告の3案セットを生成します</p>
        </div>
      </div>

      {/* 注意書き */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <p>「治る」「完治」などの表現は薬機法・医療広告ガイドライン違反になります。生成後は必ず確認・編集してから使用してください。</p>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-5">
        {/* 広告テーマ */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            広告テーマ・訴求内容 <span className="text-red-500">*</span>
          </label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="例: 肩こり改善、産後の骨盤矯正、梅雨時期のむくみ対策..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* 広告タイプ */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">広告の目的</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AD_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAdType(type)}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm font-medium border-2 transition',
                  adType === type
                    ? cn('border-current text-white', color.bg)
                    : 'border-slate-200 text-slate-600 hover:border-slate-300',
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* ターゲット */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            ターゲット像 <span className="text-slate-400 font-normal">（任意）</span>
          </label>
          <textarea
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            rows={2}
            placeholder="例: 30〜50代のデスクワーク男性、産後6ヶ月以内のママ..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>

        {/* 訴求サービス */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            アピールしたい強み・サービス <span className="text-slate-400 font-normal">（任意）</span>
          </label>
          <input
            value={service}
            onChange={(e) => setService(e.target.value)}
            placeholder="例: 独自の整体メソッド、鍼灸×整体の組み合わせ、完全個室..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !theme.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition',
            loading || !theme.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : cn(color.bg, 'hover:opacity-90'),
          )}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI生成中... （10〜30秒）
            </>
          ) : (
            <>
              <Sparkles size={17} />
              広告コピー3案を生成する
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={16} className="text-green-600" />
            <p className="text-sm font-semibold text-slate-700">生成完了</p>
          </div>
          <OutputPreview
            output={result.content.output}
            contentId={result.content.id}
            inputTokens={result.inputTokens}
            outputTokens={result.outputTokens}
            durationMs={result.durationMs}
            canvaDesignType="facebook_post"
          />
        </div>
      )}
    </div>
  );
}
