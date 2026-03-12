'use client';

import { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import {
  VIDEO_AD_LENGTHS,
  VIDEO_AD_LENGTH_LABELS,
  VideoAdLength,
  VideoAdScript,
} from '@/types';
import { Video, Copy, Check, ChevronDown, ChevronUp, Loader2, Film, Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import { getClinicColor } from '@/lib/utils/clinic';

// ─── APPEAL_AXIS options ──────────────────────────────────
const APPEAL_AXIS_OPTIONS = [
  '痛み訴求', 'しびれ訴求', '不安訴求', '最後の選択肢', '再発防止', '生活改善',
];

// ─── ScriptCard ───────────────────────────────────────────
function ScriptCard({ script }: { script: VideoAdScript }) {
  const [copiedNarration, setCopiedNarration] = useState(false);
  const [copiedAll,       setCopiedAll]       = useState(false);
  const [showScenes,      setShowScenes]      = useState(true);

  const fullText = [
    `【${script.label}】`,
    `\n■ 冒頭（つかみ）\n${script.opening}`,
    `\n■ ナレーション原稿\n${script.narration}`,
    `\n■ シーン構成`,
    ...script.scenes.map(s => `${s.timeCode}\n  テロップ: ${s.caption}\n  映像指示: ${s.visual}`),
    `\n■ エンディング\n${script.closing}`,
    `\n■ CTA\n${script.cta}`,
  ].join('\n');

  const copyNarration = async () => {
    await navigator.clipboard.writeText(script.narration);
    setCopiedNarration(true);
    setTimeout(() => setCopiedNarration(false), 2000);
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const lengthBadgeColor: Record<VideoAdLength, string> = {
    '15s': 'bg-blue-100 text-blue-700',
    '30s': 'bg-emerald-100 text-emerald-700',
    '60s': 'bg-violet-100 text-violet-700',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Clapperboard size={16} className="text-slate-500" />
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', lengthBadgeColor[script.length])}>
            {script.label}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyNarration}
            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600 flex items-center gap-1"
          >
            {copiedNarration ? <><Check size={12} className="text-green-600" />ナレコピー</> : <><Copy size={12} />ナレーション</>}
          </button>
          <button
            onClick={copyAll}
            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600 flex items-center gap-1"
          >
            {copiedAll ? <><Check size={12} className="text-green-600" />コピー済み</> : <><Copy size={12} />全てコピー</>}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Opening */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">■ 冒頭・つかみ</p>
          <div className="bg-amber-50 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium border border-amber-100">
            {script.opening}
          </div>
        </div>

        {/* Narration */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">■ ナレーション原稿</p>
          <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-wrap">
            {script.narration}
          </div>
        </div>

        {/* Scenes */}
        <div>
          <button
            onClick={() => setShowScenes(v => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 mb-2 hover:text-slate-700"
          >
            {showScenes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            ■ シーン構成（{script.scenes.length}シーン）
          </button>
          {showScenes && (
            <div className="space-y-2">
              {script.scenes.map((scene, i) => (
                <div key={i} className="border border-slate-100 rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5">
                    <Film size={12} className="text-slate-400" />
                    <span className="text-xs font-mono text-slate-500">{scene.timeCode}</span>
                  </div>
                  <div className="px-3 py-2 space-y-1">
                    <p className="text-xs text-slate-500 font-medium">テロップ</p>
                    <p className="text-sm text-slate-700">{scene.caption}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">映像指示</p>
                    <p className="text-sm text-slate-500 italic">{scene.visual}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Closing + CTA */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">■ エンディング</p>
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700 border border-slate-100">
              {script.closing}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">■ CTA</p>
            <div className="bg-emerald-50 rounded-lg px-3 py-2 text-sm text-emerald-700 font-medium border border-emerald-100">
              {script.cta}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function VideoAdPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [symptom,     setSymptom]     = useState('');
  const [target,      setTarget]      = useState('');
  const [appealAxis,  setAppealAxis]  = useState('痛み訴求');
  const [customAppeal, setCustomAppeal] = useState('');
  const [adLengths,   setAdLengths]   = useState<VideoAdLength[]>(['30s']);
  const [tone,        setTone]        = useState<'friendly' | 'formal' | 'casual'>('friendly');
  const [ctaStrength, setCtaStrength] = useState<1 | 2 | 3>(2);
  const [isLoading,   setIsLoading]   = useState(false);
  const [scripts,     setScripts]     = useState<VideoAdScript[]>([]);
  const [error,       setError]       = useState('');
  const [durationMs,  setDurationMs]  = useState(0);

  const toggleLength = (len: VideoAdLength) =>
    setAdLengths(prev =>
      prev.includes(len) ? prev.filter(l => l !== len) : [...prev, len],
    );

  const handleGenerate = async () => {
    if (!currentClinic)      return;
    if (!symptom.trim())     { setError('症状・お悩みを入力してください'); return; }
    if (adLengths.length === 0) { setError('1つ以上の尺を選択してください'); return; }

    setIsLoading(true);
    setError('');
    setScripts([]);

    try {
      const res = await fetch('/api/generate/video-ad', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          clinicId:   currentClinic.id,
          symptom,
          target,
          appealAxis: appealAxis === 'カスタム' ? customAppeal : appealAxis,
          adLengths,
          tone,
          ctaStrength,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '生成に失敗しました'); return; }

      setScripts(data.data.scripts);
      setDurationMs(data.data.durationMs);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', color.bg)}>
          <Video size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">動画広告クリエイティブ生成</h1>
          <p className="text-sm text-slate-500">
            症状・訴求軸を入力して、15秒〜60秒の動画広告台本（ナレーション・テロップ・映像指示）を生成します
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Input Panel ── */}
        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">

            {/* 症状 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                症状・お悩み <span className="text-red-500">*</span>
              </label>
              <input
                value={symptom}
                onChange={e => setSymptom(e.target.value)}
                placeholder="例: 腰痛・慢性的な腰のだるさ"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* ターゲット */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ターゲット（任意）</label>
              <input
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="例: 30〜50代デスクワーカー"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* 訴求軸 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">訴求軸</label>
              <div className="flex flex-wrap gap-2">
                {APPEAL_AXIS_OPTIONS.map(a => (
                  <button
                    key={a}
                    onClick={() => setAppealAxis(a)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                      appealAxis === a
                        ? cn('text-white border-transparent shadow-sm', color.bg)
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                    )}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* 広告尺 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">広告の尺</label>
              <div className="space-y-2">
                {VIDEO_AD_LENGTHS.map(len => (
                  <label key={len} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={adLengths.includes(len)}
                      onChange={() => toggleLength(len)}
                      className="w-4 h-4 accent-blue-600 rounded"
                    />
                    <span className="text-sm text-slate-700">{VIDEO_AD_LENGTH_LABELS[len]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 文体 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">文体</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value as 'friendly' | 'formal' | 'casual')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="friendly">やわらかく親しみやすい</option>
                <option value="formal">丁寧でフォーマル</option>
                <option value="casual">カジュアル</option>
              </select>
            </div>

            {/* CTA強度 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                CTA の強さ <span className="text-slate-400 font-normal">({ctaStrength})</span>
              </label>
              <input
                type="range"
                min={1} max={3} step={1}
                value={ctaStrength}
                onChange={e => setCtaStrength(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>柔らかめ</span>
                <span>標準</span>
                <span>強め</span>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || !symptom.trim() || adLengths.length === 0}
            className={cn(
              'w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition',
              isLoading || !symptom.trim() || adLengths.length === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : cn('hover:opacity-90', color.bg),
            )}
          >
            {isLoading
              ? <><Loader2 size={16} className="animate-spin" />生成中...</>
              : <><Video size={16} />台本を生成</>}
          </button>
        </div>

        {/* ── Results Panel ── */}
        <div className="lg:col-span-3 space-y-4">
          {scripts.length === 0 && !isLoading && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <Clapperboard size={40} className="mb-3 opacity-30" />
              <p className="text-sm">症状と尺を選択して台本を生成してください</p>
            </div>
          )}

          {isLoading && (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200">
              <Loader2 size={32} className="animate-spin text-blue-400 mb-3" />
              <p className="text-sm text-slate-500">動画広告台本を生成しています…</p>
            </div>
          )}

          {scripts.length > 0 && (
            <>
              <p className="text-sm text-slate-500">
                {scripts.length}本の台本を生成しました（{(durationMs / 1000).toFixed(1)}秒）
              </p>
              <div className="space-y-4">
                {scripts.map((script, i) => (
                  <ScriptCard key={i} script={script} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
