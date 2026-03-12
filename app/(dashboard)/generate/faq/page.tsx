'use client';

import { useState } from 'react';
import { FileText, Sparkles, AlertCircle } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { OutputPreview } from '@/components/generate/OutputPreview';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import type { GeneratedContent } from '@/types';

export default function FaqGeneratePage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [symptom, setSymptom]             = useState('');
  const [targetPatient, setTargetPatient] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [loading, setLoading]             = useState(false);
  const [result, setResult]               = useState<{
    content: GeneratedContent;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
  } | null>(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!currentClinic || !symptom.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId:      currentClinic.id,
          symptom:       symptom.trim(),
          targetPatient: targetPatient.trim(),
          additionalInfo: additionalInfo.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? '生成に失敗しました');
      }

      const json = await res.json();
      setResult(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  if (!currentClinic) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        院を選択してください
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
          <FileText size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">FAQ・症状ページ生成</h1>
          <p className="text-sm text-slate-500">SEO対応の症状ページ・Q&Aをまとめて生成します</p>
        </div>
      </div>

      {/* 注意書き */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <p>生成されたコンテンツは必ず内容を確認し、院のブランドガイドラインに沿って編集してから使用してください。</p>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            症状名 <span className="text-red-500">*</span>
          </label>
          <input
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="例: 肩こり・首こり、腰痛、頭痛、坐骨神経痛…"
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            対象患者像 <span className="text-slate-400 font-normal">（任意）</span>
          </label>
          <textarea
            value={targetPatient}
            onChange={(e) => setTargetPatient(e.target.value)}
            rows={2}
            placeholder="例: デスクワーク中心の30〜40代、産後の女性、スポーツをしている学生..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            補足情報 <span className="text-slate-400 font-normal">（任意）</span>
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={2}
            placeholder="特別に伝えたいこと、除外したい内容、季節性など..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !symptom.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition',
            loading || !symptom.trim()
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
              FAQ・症状ページを生成する
            </>
          )}
        </button>
      </div>

      {/* エラー */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 結果 */}
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
          />
        </div>
      )}
    </div>
  );
}
