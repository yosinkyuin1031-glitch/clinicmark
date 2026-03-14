'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useClinic } from '@/contexts/ClinicContext';
import {
  PATIENT_VOICE_MEDIA_TYPES,
  PATIENT_VOICE_MEDIA_LABELS,
  PATIENT_VOICE_MEDIA_HALF_WIDTH,
  PatientVoiceMediaType,
  PatientVoiceOutputItem,
} from '@/types';
import { Mic2, Copy, Check, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/clinic';
import { getClinicColor } from '@/lib/utils/clinic';
import { RatingButtons } from '@/components/library/RatingButtons';
import { CanvaButton } from '@/components/ui/CanvaButton';

const PV_CANVA_MAP: Partial<Record<string, string>> = {
  pv_meta_ad:         'facebook_post',
  pv_instagram:       'instagram_post',
  pv_instagram_story: 'instagram_story',
};

// ─── 媒体グループ ─────────────────────────────────────────
const MEDIA_GROUPS_PV = [
  { label: 'Instagram',    types: ['pv_instagram', 'pv_instagram_story'] as PatientVoiceMediaType[] },
  { label: '動画・広告',    types: ['pv_youtube_short', 'pv_meta_ad'] as PatientVoiceMediaType[] },
  { label: 'LINE・Threads', types: ['pv_line_message', 'pv_threads'] as PatientVoiceMediaType[] },
];

// ─── OutputCard ───────────────────────────────────────────
function OutputCard({ item }: { item: PatientVoiceOutputItem }) {
  const [copied, setCopied]     = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isLong = item.content.length > 200;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(item.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-700">{item.label}</span>
          <span className="text-xs text-slate-400">{item.charCount}字</span>
          {item.warnings.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} /> 要確認
            </span>
          )}
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {item.contentId && (
            <RatingButtons contentId={item.contentId} initialRating="none" size="sm" />
          )}
          {PV_CANVA_MAP[item.mediaType] && (
            <CanvaButton
              content={item.content}
              designType={PV_CANVA_MAP[item.mediaType]!}
              title={item.label}
              size="sm"
            />
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600"
          >
            {copied
              ? <><Check size={12} className="text-green-600" />コピー済み</>
              : <><Copy size={12} />コピー</>}
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        {item.warnings.map((w, i) => (
          <div key={i} className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            {w}
          </div>
        ))}
        <pre className={cn(
          'text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed',
          isLong && !expanded && 'line-clamp-6',
        )}>
          {item.content}
        </pre>
        {isLong && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            {expanded
              ? <><ChevronUp size={12} />折りたたむ</>
              : <><ChevronDown size={12} />もっと見る</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function PatientVoicePage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">読み込み中...</div>}>
      <PatientVoicePageContent />
    </Suspense>
  );
}

function PatientVoicePageContent() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');
  const searchParams = useSearchParams();

  const [voiceText,    setVoiceText]    = useState('');
  const [symptom,      setSymptom]      = useState('');

  // 音声文字起こしページからの連携
  useEffect(() => {
    const voice = searchParams.get('voice');
    if (voice) setVoiceText(decodeURIComponent(voice));
  }, [searchParams]);
  const [target,       setTarget]       = useState('');
  const [writingStyle, setWritingStyle] = useState<'friendly' | 'formal' | 'casual'>('friendly');
  const [selectedTypes, setSelectedTypes] = useState<PatientVoiceMediaType[]>([...PATIENT_VOICE_MEDIA_TYPES]);
  const [isLoading,    setIsLoading]    = useState(false);
  const [results,      setResults]      = useState<PatientVoiceOutputItem[]>([]);
  const [error,        setError]        = useState('');
  const [durationMs,   setDurationMs]   = useState(0);

  const toggleType = (type: PatientVoiceMediaType) =>
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type],
    );

  const toggleGroup = (types: PatientVoiceMediaType[]) => {
    const allSelected = types.every(t => selectedTypes.includes(t));
    setSelectedTypes(prev =>
      allSelected ? prev.filter(t => !types.includes(t)) : [...new Set([...prev, ...types])],
    );
  };

  const handleGenerate = async () => {
    if (!currentClinic) return;
    if (!voiceText.trim())     { setError('患者の声を入力してください'); return; }
    if (selectedTypes.length === 0) { setError('1つ以上の媒体を選択してください'); return; }

    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch('/api/generate/patient-voice', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          clinicId: currentClinic.id,
          voiceText,
          symptom,
          target,
          mediaTypes:   selectedTypes,
          writingStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '生成に失敗しました'); return; }

      setResults(data.data.outputs);
      setDurationMs(data.data.durationMs);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 全幅 / 半幅で分けてグリッドレイアウトを作る
  const fullWidthResults = results.filter(r => !PATIENT_VOICE_MEDIA_HALF_WIDTH.has(r.mediaType));
  const halfWidthResults = results.filter(r =>  PATIENT_VOICE_MEDIA_HALF_WIDTH.has(r.mediaType));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', color.bg)}>
          <Mic2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">患者の声 → コンテンツ生成</h1>
          <p className="text-sm text-slate-500">
            患者さんのリアルな言葉を活かして、共感性の高いコンテンツを一括生成します
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Input Panel ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* 患者の声 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                患者さんの言葉・発言 <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-400 mb-2">
                施術中や問診時に話してくれた言葉をそのまま貼り付けてください
              </p>
              <textarea
                value={voiceText}
                onChange={e => setVoiceText(e.target.value)}
                rows={6}
                placeholder="例：毎朝起きると首と肩がパンパンで、仕事中も頭痛が続いてしまって…。夜はしっかり寝ているのに、翌朝にはまた同じ状態で正直もう諦めていました。"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1 text-right">{voiceText.length}文字</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">症状・悩み（任意）</label>
              <input
                value={symptom}
                onChange={e => setSymptom(e.target.value)}
                placeholder="例: 慢性的な肩こり・頭痛"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ターゲット（任意）</label>
              <input
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="例: 30〜40代デスクワーカー"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">文体</label>
              <select
                value={writingStyle}
                onChange={e => setWritingStyle(e.target.value as 'friendly' | 'formal' | 'casual')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="friendly">やわらかく親しみやすい</option>
                <option value="formal">丁寧でフォーマル</option>
                <option value="casual">カジュアル・話しかける</option>
              </select>
            </div>
          </div>

          {/* 媒体選択 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">生成するコンテンツ</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTypes([...PATIENT_VOICE_MEDIA_TYPES])}
                  className="text-xs text-blue-600 hover:underline"
                >全選択</button>
                <button
                  onClick={() => setSelectedTypes([])}
                  className="text-xs text-slate-400 hover:underline"
                >解除</button>
              </div>
            </div>

            {MEDIA_GROUPS_PV.map(group => (
              <div key={group.label}>
                <button
                  onClick={() => toggleGroup(group.types)}
                  className="text-xs font-medium text-slate-500 mb-1.5 hover:text-slate-700"
                >
                  {group.label}
                </button>
                <div className="flex flex-wrap gap-2">
                  {group.types.map(type => (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
                        selectedTypes.includes(type)
                          ? cn('text-white border-transparent shadow-sm', color.bg)
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300',
                      )}
                    >
                      {PATIENT_VOICE_MEDIA_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || !voiceText.trim() || selectedTypes.length === 0}
            className={cn(
              'w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition',
              isLoading || !voiceText.trim() || selectedTypes.length === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : cn('hover:opacity-90', color.bg),
            )}
          >
            {isLoading
              ? <><Loader2 size={16} className="animate-spin" />生成中...</>
              : <><Mic2 size={16} />コンテンツを生成</>}
          </button>
        </div>

        {/* ── Results Panel ── */}
        <div className="lg:col-span-3 space-y-4">
          {results.length === 0 && !isLoading && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <Mic2 size={40} className="mb-3 opacity-30" />
              <p className="text-sm">患者さんの声を入力して生成ボタンを押してください</p>
            </div>
          )}

          {isLoading && (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200">
              <Loader2 size={32} className="animate-spin text-blue-400 mb-3" />
              <p className="text-sm text-slate-500">患者さんの声を元にコンテンツを生成しています…</p>
            </div>
          )}

          {results.length > 0 && (
            <>
              <p className="text-sm text-slate-500">
                {results.length}件のコンテンツを生成しました（{(durationMs / 1000).toFixed(1)}秒）
              </p>

              {/* 全幅カード */}
              <div className="space-y-4">
                {fullWidthResults.map((item, i) => (
                  <OutputCard key={i} item={item} />
                ))}
              </div>

              {/* 半幅カード */}
              {halfWidthResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {halfWidthResults.map((item, i) => (
                    <OutputCard key={i} item={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
