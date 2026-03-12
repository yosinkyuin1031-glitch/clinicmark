'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import {
  COMPARE_TYPE_LABELS,
  type CompareType, type CompetitorInput, type CompetitorAnalysis,
} from '@/types';
import { CompetitorResult } from '@/components/tools/CompetitorResult';

const COMPARE_TYPES: CompareType[] = ['seo', 'meo', 'lp', 'instagram', 'appeal'];

export default function CompetitorPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // フォーム状態
  const [competitorName, setCompetitorName] = useState('');
  const [url,            setUrl]            = useState('');
  const [pageText,       setPageText]       = useState('');
  const [compareTypes,   setCompareTypes]   = useState<CompareType[]>(['seo', 'lp', 'appeal']);

  // 生成状態
  const [loading,   setLoading]   = useState(false);
  const [analysis,  setAnalysis]  = useState<CompetitorAnalysis | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [duration,  setDuration]  = useState<number | null>(null);

  const toggleType = (type: CompareType) =>
    setCompareTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type],
    );

  const handleAnalyze = async () => {
    if (!currentClinic || !competitorName.trim() || !pageText.trim() || compareTypes.length === 0) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const body: CompetitorInput = {
        clinicId:       currentClinic.id,
        competitorName: competitorName.trim(),
        url:            url.trim(),
        pageText:       pageText.trim(),
        compareTypes,
      };

      const res = await fetch('/api/tools/competitor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? '分析に失敗しました');
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setDuration(data.durationMs);
    } catch (e) {
      setError(e instanceof Error ? e.message : '分析中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const canAnalyze =
    !loading && !!currentClinic && !!competitorName.trim() &&
    !!pageText.trim() && compareTypes.length > 0;

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-0">
      {/* ── 左パネル（入力） ── */}
      <aside className="w-full md:w-72 shrink-0 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* タイトル */}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.bg)}>
              <Search size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">競合分析</h1>
              <p className="text-xs text-slate-500">競合テキストを貼り付けて分析</p>
            </div>
          </div>

          {/* 競合院名 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              競合院名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="例: ○○整骨院"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* URL（任意） */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              URL（任意・参考表示のみ）
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 分析軸 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              分析軸 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {COMPARE_TYPES.map((type) => {
                const active = compareTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg border transition text-sm font-medium',
                      active
                        ? cn('border-transparent text-white', color.bg)
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {COMPARE_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* テキスト貼り付け */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              競合ページテキスト <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-400 mb-1.5">
              競合のHP・SNS・口コミなどのテキストをコピペしてください
            </p>
            <textarea
              value={pageText}
              onChange={(e) => setPageText(e.target.value)}
              placeholder="競合サイトのテキストをここに貼り付けてください..."
              rows={8}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            {pageText && (
              <p className="text-xs text-slate-400 mt-1">{pageText.length.toLocaleString()}文字</p>
            )}
          </div>

          {/* 分析ボタン */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition',
              canAnalyze
                ? cn('text-white shadow-sm hover:opacity-90', color.bg)
                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            )}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" />分析中...</>
              : <><Search size={16} />競合を分析する</>
            }
          </button>

          {!competitorName.trim() && (
            <p className="text-xs text-center text-slate-400">※ 競合院名を入力してください</p>
          )}
          {!pageText.trim() && competitorName.trim() && (
            <p className="text-xs text-center text-slate-400">※ 競合のテキストを貼り付けてください</p>
          )}
        </div>
      </aside>

      {/* ── 右エリア（結果） ── */}
      <div className="flex-1 min-w-0">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin mb-4" />
            <p className="text-sm font-medium">競合テキストを分析中...</p>
            <p className="text-xs mt-1">ブランド辞書と照合しています</p>
          </div>
        )}

        {!loading && !analysis && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-20', color.bg)}>
              <Search size={32} className="text-white" />
            </div>
            <p className="text-slate-500 font-medium">競合のテキストを貼り付けて</p>
            <p className="text-slate-500 font-medium">「競合を分析する」を押してください</p>
            <p className="text-xs text-slate-400 mt-2">
              HP・SNS・口コミなど、競合のテキストを貼り付けるだけで分析できます
            </p>
          </div>
        )}

        {!loading && analysis && (
          <CompetitorResult
            analysis={analysis}
            accentBg={color.bg}
            accentText={color.text}
            durationMs={duration ?? undefined}
          />
        )}
      </div>
    </div>
  );
}
