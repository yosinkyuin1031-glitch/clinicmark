'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Images, LayoutList, Table2 } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import {
  STORY_POST_TYPE_LABELS, STORY_MOOD_LABELS,
  type StoryPostType, type StoryMood, type StorySlide, type StoryGenInput,
} from '@/types';
import { StorySlideCard } from '@/components/generate/StorySlideCard';
import { StoryTable }     from '@/components/generate/StoryTable';

// ─── 定数 ────────────────────────────────────────────────
const POST_TYPES: { value: StoryPostType; label: string }[] = [
  { value: 'story', label: 'ストーリーズ' },
  { value: 'feed',  label: 'フィード' },
  { value: 'reel',  label: 'リール' },
];

const MOODS: { value: StoryMood; label: string; emoji: string }[] = [
  { value: 'warm', label: 'あたたかみ', emoji: '☀️' },
  { value: 'cool', label: 'クール',     emoji: '❄️' },
  { value: 'pop',  label: 'ポップ',     emoji: '🎉' },
  { value: 'calm', label: 'おだやか',   emoji: '🌿' },
];

const CTA_LABELS: Record<1 | 2 | 3, string> = {
  1: '柔らかめ',
  2: '標準',
  3: '強め',
};

type ViewMode = 'card' | 'table';

export default function InstagramStoryPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // ── フォーム状態 ──
  const [theme,       setTheme]       = useState('');
  const [postType,    setPostType]    = useState<StoryPostType>('story');
  const [target,      setTarget]      = useState('');
  const [mood,        setMood]        = useState<StoryMood>('warm');
  const [ctaStrength, setCtaStrength] = useState<1 | 2 | 3>(2);
  const [slideCount,  setSlideCount]  = useState(5);
  const [imageNotes,  setImageNotes]  = useState('');

  // ── 生成状態 ──
  const [loading,  setLoading]  = useState(false);
  const [slides,   setSlides]   = useState<StorySlide[] | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  const handleGenerate = async () => {
    if (!currentClinic || !theme.trim()) return;

    setLoading(true);
    setError(null);
    setSlides(null);

    try {
      const body: StoryGenInput = {
        clinicId:    currentClinic.id,
        theme:       theme.trim(),
        postType,
        target:      target.trim(),
        mood,
        ctaStrength,
        slideCount:  postType === 'story' ? slideCount : 1,
        imageNotes:  imageNotes.trim(),
      };

      const start = Date.now();
      const res = await fetch('/api/generate/instagram-story', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? '生成に失敗しました');
      }

      const data = await res.json();
      setSlides(data.slides);
      setDuration(Date.now() - start);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = !loading && !!currentClinic && !!theme.trim();
  const isStory     = postType === 'story';

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-0">
      {/* ── 左パネル（フォーム） ── */}
      <aside className="w-full md:w-72 shrink-0 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* タイトル */}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.bg)}>
              <Images size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Instagramストーリーズ</h1>
              <p className="text-xs text-slate-500">スライド台本を自動生成</p>
            </div>
          </div>

          {/* テーマ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              テーマ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例: 腰痛改善、産後ケア"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 投稿タイプ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">投稿タイプ</label>
            <div className="flex gap-1.5">
              {POST_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPostType(value)}
                  className={cn(
                    'flex-1 text-xs py-1.5 rounded-lg border transition font-medium',
                    postType === value
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ターゲット */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">ターゲット（任意）</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="例: 30〜50代女性"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* スライド数（ストーリーのみ） */}
          {isStory && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                スライド数 <span className="text-slate-400 font-normal">({slideCount}枚)</span>
              </label>
              <input
                type="range"
                min={1}
                max={7}
                value={slideCount}
                onChange={(e) => setSlideCount(Number(e.target.value))}
                className="w-full accent-slate-700"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                <span>1</span><span>4</span><span>7</span>
              </div>
            </div>
          )}

          {/* 雰囲気 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">雰囲気・トーン</label>
            <div className="grid grid-cols-2 gap-1.5">
              {MOODS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setMood(value)}
                  className={cn(
                    'text-xs py-1.5 px-2 rounded-lg border transition font-medium text-left',
                    mood === value
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {emoji} {label}
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

          {/* 画像メモ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              画像イメージメモ（任意）
            </label>
            <textarea
              value={imageNotes}
              onChange={(e) => setImageNotes(e.target.value)}
              placeholder="例: 明るい院内写真、スタッフの笑顔"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
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
              : <><Sparkles size={16} />台本を生成</>
            }
          </button>

          {!theme.trim() && (
            <p className="text-xs text-center text-slate-400">※ テーマを入力してください</p>
          )}
        </div>
      </aside>

      {/* ── 右エリア（出力） ── */}
      <div className="flex-1 min-w-0">
        {/* エラー */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin mb-4" />
            <p className="text-sm font-medium">スライド台本を生成中...</p>
            <p className="text-xs mt-1">ブランド辞書を参照しています</p>
          </div>
        )}

        {/* 空状態 */}
        {!loading && !slides && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-20', color.bg)}>
              <Images size={32} className="text-white" />
            </div>
            <p className="text-slate-500 font-medium">左のフォームを入力して</p>
            <p className="text-slate-500 font-medium">「台本を生成」を押してください</p>
            <p className="text-xs text-slate-400 mt-2">
              院別ブランド辞書を参照しながらスライド台本を生成します
            </p>
          </div>
        )}

        {/* 生成結果 */}
        {!loading && slides && (
          <>
            {/* サマリー＋表示切替 */}
            <div className="flex items-center gap-3 mb-4">
              <p className="text-sm text-slate-600 flex-1">
                <span className="font-bold text-slate-900">{slides.length}枚</span> のスライド台本を生成しました
                {duration != null && (
                  <span className="text-xs text-slate-400 ml-2">
                    {(duration / 1000).toFixed(1)}秒
                  </span>
                )}
              </p>
              {/* 表示切替ボタン */}
              <div className="flex rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition',
                    viewMode === 'card'
                      ? cn('text-white', color.bg)
                      : 'text-slate-600 bg-white hover:bg-slate-50',
                  )}
                >
                  <LayoutList size={13} />
                  カード
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition border-l border-slate-200',
                    viewMode === 'table'
                      ? cn('text-white', color.bg)
                      : 'text-slate-600 bg-white hover:bg-slate-50',
                  )}
                >
                  <Table2 size={13} />
                  表形式
                </button>
              </div>
            </div>

            {/* カード表示 */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {slides.map((slide) => (
                  <StorySlideCard
                    key={slide.page}
                    slide={slide}
                    accentBg={color.bg}
                    accentText={color.text}
                  />
                ))}
              </div>
            )}

            {/* 表形式（Canva貼り付け用） */}
            {viewMode === 'table' && (
              <StoryTable
                slides={slides}
                accentBg={color.bg}
                accentText={color.text}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
