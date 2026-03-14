'use client';

import { useState } from 'react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import { Sparkles, Loader2, Youtube, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
type VideoType = 'short' | 'standard' | 'long';
type Tone = 'friendly' | 'professional' | 'casual' | 'energetic';

interface YouTubeSection {
  timeCode: string;
  title: string;
  narration: string;
  visualInstruction: string;
}

interface YouTubeResult {
  titles: string[];
  thumbnailTexts: string[];
  sections: YouTubeSection[];
  fullScript: string;
  descriptionTemplate: string;
  cta: string;
}

const VIDEO_TYPE_OPTIONS: { value: VideoType; label: string }[] = [
  { value: 'short',    label: '60秒ショート' },
  { value: 'standard', label: '5-10分（標準）' },
  { value: 'long',     label: '15-30分（ロング）' },
];

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'friendly',     label: 'やわらかく親しみやすい' },
  { value: 'professional', label: '専門的で信頼感がある' },
  { value: 'casual',       label: 'カジュアル' },
  { value: 'energetic',    label: '元気・エネルギッシュ' },
];

// ─── Main Page ───────────────────────────────────────────
export default function YouTubeGeneratePage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // form state
  const [theme, setTheme]                     = useState('');
  const [videoType, setVideoType]             = useState<VideoType>('standard');
  const [target, setTarget]                   = useState('');
  const [tone, setTone]                       = useState<Tone>('friendly');
  const [includeThumbnail, setIncludeThumbnail] = useState(true);
  const [keywords, setKeywords]               = useState('');

  // output state
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState<YouTubeResult | null>(null);
  const [error, setError]       = useState('');
  const [durationMs, setDurationMs] = useState(0);

  // section toggle
  const [showSections, setShowSections] = useState(true);

  // copy helpers
  const [copiedField, setCopiedField] = useState('');
  const copyText = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleGenerate = async () => {
    if (!currentClinic) return;
    if (!theme.trim()) { setError('テーマを入力してください'); return; }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId: currentClinic.id,
          theme: theme.trim(),
          videoType,
          target: target.trim(),
          tone,
          includeThumbnail,
          keywords: keywords.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? '生成に失敗しました'); return; }

      setResult(data.data.result);
      setDurationMs(data.data.durationMs);
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const buildFullText = (r: YouTubeResult) => {
    const lines: string[] = [];
    lines.push('【タイトル候補】');
    r.titles.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    if (r.thumbnailTexts.length > 0) {
      lines.push('\n【サムネイルテキスト候補】');
      r.thumbnailTexts.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    }
    lines.push('\n【動画構成】');
    r.sections.forEach(s => {
      lines.push(`\n${s.timeCode} ${s.title}`);
      lines.push(`ナレーション: ${s.narration}`);
      lines.push(`映像指示: ${s.visualInstruction}`);
    });
    lines.push('\n【台本本文】');
    lines.push(r.fullScript);
    lines.push('\n【概要欄テンプレート】');
    lines.push(r.descriptionTemplate);
    lines.push('\n【CTA文】');
    lines.push(r.cta);
    return lines.join('\n');
  };

  if (!currentClinic) {
    return <div className="flex items-center justify-center h-64 text-slate-400">院を選択してください</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', color.bg)}>
          <Youtube size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">YouTube台本生成</h1>
          <p className="text-sm text-slate-500">
            テーマを入力して、タイトル・サムネイル・構成・台本・概要欄をまとめて生成します
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Input Panel ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">

            {/* テーマ */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                テーマ <span className="text-red-500">*</span>
              </label>
              <input
                value={theme}
                onChange={e => setTheme(e.target.value)}
                placeholder="例: 肩こりを根本から改善する3つの方法"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* 動画タイプ */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">動画タイプ</label>
              <select
                value={videoType}
                onChange={e => setVideoType(e.target.value as VideoType)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {VIDEO_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* ターゲット */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ターゲット <span className="text-slate-400 font-normal">（任意）</span>
              </label>
              <input
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="例: 30〜50代のデスクワーカー"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* トーン */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">トーン</label>
              <select
                value={tone}
                onChange={e => setTone(e.target.value as Tone)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                {TONE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* サムネイル指示 */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeThumbnail}
                  onChange={e => setIncludeThumbnail(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                <span className="text-sm text-slate-700">サムネイルテキスト候補も生成する</span>
              </label>
            </div>

            {/* キーワード */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SEOキーワード <span className="text-slate-400 font-normal">（任意）</span>
              </label>
              <textarea
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="例: 肩こり 改善, 整体 セルフケア, 肩こり ストレッチ"
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !theme.trim()}
            className={cn(
              'w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition',
              loading || !theme.trim()
                ? 'bg-slate-300 cursor-not-allowed'
                : cn('hover:opacity-90', color.bg),
            )}
          >
            {loading
              ? <><Loader2 size={16} className="animate-spin" />生成中...</>
              : <><Sparkles size={16} />YouTube台本を生成</>}
          </button>
        </div>

        {/* ── Results Panel ── */}
        <div className="lg:col-span-3 space-y-4">
          {!result && !loading && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
              <Youtube size={40} className="mb-3 opacity-30" />
              <p className="text-sm">テーマを入力して台本を生成してください</p>
            </div>
          )}

          {loading && (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200">
              <Loader2 size={32} className="animate-spin text-red-400 mb-3" />
              <p className="text-sm text-slate-500">YouTube台本を生成しています...</p>
            </div>
          )}

          {result && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  生成完了（{(durationMs / 1000).toFixed(1)}秒）
                </p>
                <button
                  onClick={() => copyText(buildFullText(result), 'all')}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition text-slate-600 flex items-center gap-1"
                >
                  {copiedField === 'all' ? <><Check size={12} className="text-green-600" />コピー済み</> : <><Copy size={12} />全てコピー</>}
                </button>
              </div>

              {/* タイトル候補 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">タイトル候補</p>
                  <button
                    onClick={() => copyText(result.titles.join('\n'), 'titles')}
                    className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 flex items-center gap-1"
                  >
                    {copiedField === 'titles' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="p-4 space-y-2">
                  {result.titles.map((title, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 mt-0.5', color.bg)}>
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700">{title}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* サムネイルテキスト候補 */}
              {result.thumbnailTexts.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-700">サムネイルテキスト候補</p>
                    <button
                      onClick={() => copyText(result.thumbnailTexts.join('\n'), 'thumbnails')}
                      className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 flex items-center gap-1"
                    >
                      {copiedField === 'thumbnails' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.thumbnailTexts.map((text, i) => (
                      <div key={i} className="bg-amber-50 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium border border-amber-100">
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 動画構成 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <button
                    onClick={() => setShowSections(v => !v)}
                    className="flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900"
                  >
                    {showSections ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    動画構成（{result.sections.length}セクション）
                  </button>
                  <button
                    onClick={() => copyText(
                      result.sections.map(s => `${s.timeCode} ${s.title}\nナレーション: ${s.narration}\n映像指示: ${s.visualInstruction}`).join('\n\n'),
                      'sections'
                    )}
                    className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 flex items-center gap-1"
                  >
                    {copiedField === 'sections' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                </div>
                {showSections && (
                  <div className="p-4 space-y-3">
                    {result.sections.map((section, i) => (
                      <div key={i} className="border border-slate-100 rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5">
                          <span className="text-xs font-mono text-slate-500">{section.timeCode}</span>
                          <span className="text-xs font-semibold text-slate-700">{section.title}</span>
                        </div>
                        <div className="px-3 py-2 space-y-1">
                          <p className="text-xs text-slate-500 font-medium">ナレーション</p>
                          <p className="text-sm text-slate-700">{section.narration}</p>
                          <p className="text-xs text-slate-500 font-medium mt-1">映像指示</p>
                          <p className="text-sm text-slate-500 italic">{section.visualInstruction}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 台本本文 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">台本本文</p>
                  <button
                    onClick={() => copyText(result.fullScript, 'script')}
                    className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 flex items-center gap-1"
                  >
                    {copiedField === 'script' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="p-4">
                  <div className="bg-slate-50 rounded-lg px-3 py-3 text-sm text-slate-700 leading-relaxed border border-slate-100 whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {result.fullScript}
                  </div>
                </div>
              </div>

              {/* 概要欄テンプレート */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">概要欄テンプレート</p>
                  <button
                    onClick={() => copyText(result.descriptionTemplate, 'description')}
                    className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 flex items-center gap-1"
                  >
                    {copiedField === 'description' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="p-4">
                  <div className="bg-blue-50 rounded-lg px-3 py-3 text-sm text-slate-700 leading-relaxed border border-blue-100 whitespace-pre-wrap">
                    {result.descriptionTemplate}
                  </div>
                </div>
              </div>

              {/* CTA文 */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">CTA文</p>
                  <button
                    onClick={() => copyText(result.cta, 'cta')}
                    className="text-xs px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 flex items-center gap-1"
                  >
                    {copiedField === 'cta' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                  </button>
                </div>
                <div className="p-4">
                  <div className="bg-emerald-50 rounded-lg px-3 py-2 text-sm text-emerald-700 font-medium border border-emerald-100 whitespace-pre-wrap">
                    {result.cta}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
