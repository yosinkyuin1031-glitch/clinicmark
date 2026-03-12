'use client';

import { useState } from 'react';
import { Instagram, Sparkles, AlertCircle } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { OutputPreview } from '@/components/generate/OutputPreview';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import type { GeneratedContent } from '@/types';

type PostType = 'post' | 'story';

const POST_TYPES: { value: PostType; label: string; desc: string }[] = [
  { value: 'post',  label: 'フィード投稿',   desc: 'キャプション + ハッシュタグ + CTA' },
  { value: 'story', label: 'ストーリーズ台本', desc: 'スライドごとのテキスト + デザイン案' },
];

const PURPOSES = ['認知拡大', 'エンゲージメント向上', '来院促進', '教育・信頼構築'];
const SLIDE_COUNTS = ['3', '5', '7', '10'];

export default function InstagramGeneratePage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [postType, setPostType]   = useState<PostType>('post');
  const [theme, setTheme]         = useState('');
  const [purpose, setPurpose]     = useState('認知拡大');
  const [target, setTarget]       = useState('');
  const [slideCount, setSlideCount] = useState('5');

  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<{
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
      const body = postType === 'post'
        ? { type: 'post',  clinicId: currentClinic.id, theme: theme.trim(), purpose, target: target.trim() }
        : { type: 'story', clinicId: currentClinic.id, theme: theme.trim(), slideCount };

      const res = await fetch('/api/generate/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
          <Instagram size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Instagram台本生成</h1>
          <p className="text-sm text-slate-500">フィード投稿・ストーリーズの台本をAIが作成します</p>
        </div>
      </div>

      {/* 注意書き */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <p>生成後は必ず内容を確認し、院のトーンに合わせて編集してから投稿してください。</p>
      </div>

      {/* 投稿タイプ選択 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {POST_TYPES.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => { setPostType(value); setResult(null); }}
            className={cn(
              'p-4 rounded-xl border-2 text-left transition',
              postType === value
                ? cn('border-current', color.text, 'bg-slate-50')
                : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <p className={cn('font-semibold text-sm mb-0.5', postType === value ? color.text : 'text-slate-800')}>
              {label}
            </p>
            <p className="text-xs text-slate-500">{desc}</p>
          </button>
        ))}
      </div>

      {/* 入力フォーム */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-5">
        {/* テーマ */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            テーマ・内容 <span className="text-red-500">*</span>
          </label>
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder={
              postType === 'post'
                ? '例: 肩こりの原因3選、梅雨の時期の体の整え方、施術後の過ごし方'
                : '例: 今日の院内の様子、施術の流れ紹介、患者さんの声'
            }
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* 投稿の場合：目的・ターゲット */}
        {postType === 'post' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">投稿の目的</label>
              <div className="grid grid-cols-2 gap-2">
                {PURPOSES.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPurpose(p)}
                    className={cn(
                      'py-2 px-3 text-sm rounded-lg border transition text-left',
                      purpose === p
                        ? cn('border-transparent text-white', color.bg)
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                ターゲット読者 <span className="text-slate-400 font-normal">（任意）</span>
              </label>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="例: 肩こりに悩む30代女性、産後ケアを探しているママ"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </>
        )}

        {/* ストーリーの場合：スライド枚数 */}
        {postType === 'story' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">スライド枚数</label>
            <div className="flex gap-2">
              {SLIDE_COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSlideCount(c)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium rounded-lg border transition',
                    slideCount === c
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {c}枚
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 生成ボタン */}
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
              AI生成中...
            </>
          ) : (
            <>
              <Sparkles size={17} />
              {postType === 'post' ? '投稿台本を生成する' : 'ストーリーズ台本を生成する'}
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
            canvaDesignType={postType === 'story' ? 'your_story' : 'instagram_post'}
          />
        </div>
      )}
    </div>
  );
}
