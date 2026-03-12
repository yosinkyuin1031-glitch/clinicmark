'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Target } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import {
  APPEAL_LABELS, AD_TYPE_LABELS,
  type AppealAxis, type AdType, type CampaignInput, type CampaignOutput,
} from '@/types';
import { CampaignOutputGrid } from '@/components/generate/CampaignOutputGrid';

// ─── 定数 ────────────────────────────────────────────────
const APPEAL_AXES: AppealAxis[] = ['pain', 'numbness', 'anxiety', 'nerve', 'last_resort'];
const AD_TYPES:    AdType[]     = ['image_ad', 'video_ad', 'lp'];

const WRITING_STYLE_OPTIONS = [
  { value: 'friendly' as const, label: '親しみやすい' },
  { value: 'formal'   as const, label: '丁寧' },
  { value: 'casual'   as const, label: 'カジュアル' },
];

const CTA_LABELS: Record<1 | 2 | 3, string> = {
  1: '柔らかめ',
  2: '標準',
  3: '強め',
};

// 訴求軸の説明
const APPEAL_DESCRIPTIONS: Record<AppealAxis, string> = {
  pain:        '「痛い」「つらい」という直接的な痛みへの共感',
  numbness:    'しびれや感覚異常への専門的アプローチ',
  anxiety:     '治るかどうかの不安や悩みへの共感',
  nerve:       '神経系へのアプローチを前面に出した訴求',
  last_resort: '他院で改善しなかった方へのラストリゾート訴求',
};

export default function CampaignPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // フォーム状態
  const [symptom,      setSymptom]      = useState('');
  const [target,       setTarget]       = useState('');
  const [appealAxes,   setAppealAxes]   = useState<AppealAxis[]>(['pain']);
  const [adTypes,      setAdTypes]      = useState<AdType[]>(['image_ad']);
  const [writingStyle, setWritingStyle] = useState<CampaignInput['writingStyle']>('friendly');
  const [ctaStrength,  setCtaStrength]  = useState<1 | 2 | 3>(2);

  // 生成状態
  const [loading,  setLoading]  = useState(false);
  const [outputs,  setOutputs]  = useState<CampaignOutput[] | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const toggleAxis = (axis: AppealAxis) =>
    setAppealAxes((prev) =>
      prev.includes(axis) ? prev.filter((x) => x !== axis) : [...prev, axis],
    );

  const toggleAdType = (type: AdType) =>
    setAdTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type],
    );

  const handleGenerate = async () => {
    if (!currentClinic || !symptom.trim() || appealAxes.length === 0 || adTypes.length === 0) return;

    setLoading(true);
    setError(null);
    setOutputs(null);

    try {
      const body: CampaignInput = {
        clinicId:     currentClinic.id,
        symptom:      symptom.trim(),
        target:       target.trim(),
        appealAxes,
        adTypes,
        writingStyle,
        ctaStrength,
      };

      const res = await fetch('/api/generate/campaign', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? '生成に失敗しました');
      }

      const data = await res.json();
      setOutputs(data.outputs);
      setDuration(data.durationMs);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate =
    !loading && !!currentClinic && !!symptom.trim() &&
    appealAxes.length > 0 && adTypes.length > 0;

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-0">
      {/* ── 左パネル（フォーム） ── */}
      <aside className="w-full md:w-72 shrink-0 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* タイトル */}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.bg)}>
              <Target size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">訴求軸別広告・LP</h1>
              <p className="text-xs text-slate-500">複数の訴求軸で同時生成</p>
            </div>
          </div>

          {/* 症状 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              症状・テーマ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="例: 腰痛、肩こり、頭痛"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* ターゲット */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ターゲット（任意）</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="例: 30〜50代のデスクワーカー"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 訴求軸 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              訴求軸を選択 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1.5">
              {APPEAL_AXES.map((axis) => {
                const active = appealAxes.includes(axis);
                return (
                  <button
                    key={axis}
                    onClick={() => toggleAxis(axis)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg border transition text-sm',
                      active
                        ? cn('border-transparent text-white', color.bg)
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <span className="font-semibold">{APPEAL_LABELS[axis]}</span>
                    <span className={cn('block text-xs mt-0.5', active ? 'text-white/80' : 'text-slate-400')}>
                      {APPEAL_DESCRIPTIONS[axis]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 出力タイプ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              出力タイプ <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AD_TYPES.map((type) => {
                const active = adTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleAdType(type)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition font-medium',
                      active
                        ? cn('border-transparent text-white', color.bg)
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white',
                    )}
                  >
                    {AD_TYPE_LABELS[type]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 文体 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">文体</label>
            <div className="flex gap-1.5">
              {WRITING_STYLE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setWritingStyle(value)}
                  className={cn(
                    'flex-1 text-xs py-1.5 rounded-lg border transition font-medium',
                    writingStyle === value
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA 強度 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">CTA の強さ</label>
            <div className="flex gap-1.5">
              {([1, 2, 3] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setCtaStrength(v)}
                  className={cn(
                    'flex-1 text-xs py-1.5 rounded-lg border transition font-medium',
                    ctaStrength === v
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {CTA_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* 生成ボタン */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className={cn(
              'w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition',
              canGenerate
                ? cn('text-white shadow-sm hover:opacity-90', color.bg)
                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            )}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" />生成中...</>
              : <><Sparkles size={16} />広告コピーを生成（{appealAxes.length}軸）</>
            }
          </button>

          {appealAxes.length === 0 && (
            <p className="text-xs text-center text-slate-400">※ 訴求軸を1つ以上選択してください</p>
          )}
          {adTypes.length === 0 && (
            <p className="text-xs text-center text-slate-400">※ 出力タイプを1つ以上選択してください</p>
          )}
        </div>
      </aside>

      {/* ── 右エリア（出力） ── */}
      <div className="flex-1 min-w-0">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin mb-4" />
            <p className="text-sm font-medium">{appealAxes.length}種類の訴求軸でコピーを生成中...</p>
            <p className="text-xs mt-1">ブランド辞書を参照しています</p>
          </div>
        )}

        {!loading && !outputs && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-20', color.bg)}>
              <Target size={32} className="text-white" />
            </div>
            <p className="text-slate-500 font-medium">症状と訴求軸を選んで</p>
            <p className="text-slate-500 font-medium">「広告コピーを生成」を押してください</p>
            <p className="text-xs text-slate-400 mt-2">
              複数の訴求軸でコピーを一度に比較できます
            </p>
          </div>
        )}

        {!loading && outputs && (
          <>
            <div className="flex items-center gap-3 mb-4 px-1">
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">{outputs.length}種類</span> の訴求軸コピーを生成しました
                {duration != null && (
                  <span className="text-xs text-slate-400 ml-2">{(duration / 1000).toFixed(1)}秒</span>
                )}
              </p>
            </div>
            <CampaignOutputGrid
              outputs={outputs}
              accentBg={color.bg}
              accentText={color.text}
            />
          </>
        )}
      </div>
    </div>
  );
}
