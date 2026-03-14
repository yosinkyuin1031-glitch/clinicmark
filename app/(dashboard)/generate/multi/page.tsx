'use client';

import { useState } from 'react';
import { Sparkles, Loader2, LayoutGrid } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import {
  MEDIA_TYPES, MEDIA_LABELS, MEDIA_GROUPS, MEDIA_HALF_WIDTH,
  type MediaType, type MultiGenInput, type OutputItem,
} from '@/types';
import { MultiOutputCard } from '@/components/generate/MultiOutputCard';

// ─── 定数 ────────────────────────────────────────────────
const CHAR_COUNT_OPTIONS = [
  { value: 'short',  label: '短め' },
  { value: 'medium', label: '標準' },
  { value: 'long',   label: '詳しく' },
] as const;

const WRITING_STYLE_OPTIONS = [
  { value: 'friendly', label: '親しみやすい' },
  { value: 'formal',   label: '丁寧' },
  { value: 'casual',   label: 'カジュアル' },
] as const;

// デフォルト選択媒体
const DEFAULT_MEDIA: MediaType[] = ['instagram', 'instagram_story', 'threads', 'meta_ad'];

export default function MultiGeneratePage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // フォーム状態
  const [theme,            setTheme]            = useState('');
  const [symptom,          setSymptom]          = useState('');
  const [target,           setTarget]           = useState('');
  const [areaName,         setAreaName]         = useState('');
  const [faqCount,         setFaqCount]         = useState(5);
  const [selectedMedia,    setSelectedMedia]    = useState<MediaType[]>(DEFAULT_MEDIA);
  const [charCount,        setCharCount]        = useState<MultiGenInput['charCount']>('medium');
  const [writingStyle,     setWritingStyle]     = useState<MultiGenInput['writingStyle']>('friendly');
  const [requiredKeywords, setRequiredKeywords] = useState('');
  const [avoidExpressions, setAvoidExpressions] = useState('');

  // 生成状態
  const [loading,  setLoading]  = useState(false);
  const [outputs,  setOutputs]  = useState<OutputItem[] | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string }>({ current: 0, total: 0, label: '' });

  // 媒体トグル
  const toggleMedia = (m: MediaType) => {
    setSelectedMedia((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );
  };

  // 全選択・全解除
  const selectAll   = () => setSelectedMedia([...MEDIA_TYPES]);
  const deselectAll = () => setSelectedMedia([]);

  // 生成実行（1媒体ずつ順番に呼び出し → タイムアウト回避）
  const handleGenerate = async () => {
    if (!currentClinic || selectedMedia.length === 0 || !theme.trim()) return;

    setLoading(true);
    setError(null);
    setOutputs(null);
    setDuration(null);

    const startTime = Date.now();
    const results: OutputItem[] = [];
    const total = selectedMedia.length;

    for (let i = 0; i < total; i++) {
      const mediaType = selectedMedia[i];
      const label = MEDIA_LABELS[mediaType] ?? mediaType;
      setProgress({ current: i + 1, total, label });

      try {
        const res = await fetch('/api/generate/single', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            clinicId:         currentClinic.id,
            theme:            theme.trim(),
            symptom:          symptom.trim(),
            target:           target.trim(),
            areaName:         areaName.trim(),
            faqCount,
            mediaType,
            charCount,
            writingStyle,
            requiredKeywords: requiredKeywords.trim(),
            avoidExpressions: avoidExpressions.trim(),
          }),
        });

        if (!res.ok) {
          let errMsg = '生成に失敗しました';
          try {
            const json = await res.json();
            errMsg = json.error ?? errMsg;
          } catch {
            // JSON parse failure (timeout etc.)
          }
          results.push({
            mediaType,
            label,
            content: `[エラー] ${errMsg}`,
            charCount: 0,
            warnings: [errMsg],
          });
          continue;
        }

        let data: OutputItem;
        try {
          data = await res.json();
        } catch {
          results.push({
            mediaType,
            label,
            content: '[エラー] レスポンスの解析に失敗しました',
            charCount: 0,
            warnings: ['レスポンス解析エラー'],
          });
          continue;
        }

        results.push({
          mediaType: data.mediaType,
          label:     data.label,
          content:   data.content,
          charCount: data.charCount,
          warnings:  data.warnings,
          contentId: data.contentId,
        });
      } catch (e) {
        results.push({
          mediaType,
          label,
          content: `[エラー] ${e instanceof Error ? e.message : '通信エラー'}`,
          charCount: 0,
          warnings: [e instanceof Error ? e.message : '通信エラー'],
        });
      }
    }

    setOutputs(results);
    setDuration(Date.now() - startTime);
    setLoading(false);
    setProgress({ current: 0, total: 0, label: '' });
  };

  const canGenerate = !loading && !!currentClinic && selectedMedia.length > 0 && !!theme.trim();

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-0">
      {/* ── 左パネル（入力フォーム） ── */}
      <aside className="w-full md:w-80 shrink-0 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* タイトル */}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.bg)}>
              <LayoutGrid size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">SNS一括生成</h1>
              <p className="text-xs text-slate-500">複数SNSのコンテンツを一度に生成</p>
            </div>
          </div>

          {/* テーマ（必須） */}
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

          {/* 症状名 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">症状名（任意）</label>
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

          {/* 地域名 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">地域名（任意）</label>
            <input
              type="text"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="例: 大阪、堺市"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 媒体選択 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-600">媒体を選択</label>
              <div className="flex gap-2">
                <button onClick={selectAll}   className="text-xs text-slate-500 hover:text-slate-700 underline">全選択</button>
                <button onClick={deselectAll} className="text-xs text-slate-500 hover:text-slate-700 underline">全解除</button>
              </div>
            </div>

            {MEDIA_GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="text-xs text-slate-400 font-medium mb-1.5">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.types.map((m) => {
                    const active = selectedMedia.includes(m);
                    return (
                      <button
                        key={m}
                        onClick={() => toggleMedia(m)}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition font-medium',
                          active
                            ? cn('border-transparent text-white', color.bg)
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white',
                        )}
                      >
                        {MEDIA_LABELS[m]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 文字量 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">文字量</label>
            <div className="flex gap-1.5">
              {CHAR_COUNT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCharCount(value)}
                  className={cn(
                    'flex-1 text-xs py-1.5 rounded-lg border transition font-medium',
                    charCount === value
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {label}
                </button>
              ))}
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

          {/* 必須キーワード */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              必須キーワード（任意）
            </label>
            <textarea
              value={requiredKeywords}
              onChange={(e) => setRequiredKeywords(e.target.value)}
              placeholder="改行またはカンマ区切り&#10;例: 神経整体&#10;根本改善"
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 避けたい表現 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              避けたい表現（任意）
            </label>
            <textarea
              value={avoidExpressions}
              onChange={(e) => setAvoidExpressions(e.target.value)}
              placeholder="改行またはカンマ区切り&#10;例: 完治&#10;絶対"
              rows={3}
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
              : <><Sparkles size={16} />まとめて生成（{selectedMedia.length}媒体）</>
            }
          </button>

          {!theme.trim() && (
            <p className="text-xs text-center text-slate-400">※ テーマを入力してください</p>
          )}
          {selectedMedia.length === 0 && (
            <p className="text-xs text-center text-slate-400">※ 媒体を1つ以上選択してください</p>
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
            <p className="text-sm font-medium">
              {progress.total > 0
                ? `${progress.current} / ${progress.total} 生成中: ${progress.label}`
                : '準備中...'}
            </p>
            {progress.total > 0 && (
              <div className="w-48 bg-slate-200 rounded-full h-2 mt-3">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            )}
            <p className="text-xs mt-2">ブランド辞書を参照しています</p>
          </div>
        )}

        {/* 空状態 */}
        {!loading && !outputs && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-20', color.bg)}>
              <LayoutGrid size={32} className="text-white" />
            </div>
            <p className="text-slate-500 font-medium">左のフォームを入力して</p>
            <p className="text-slate-500 font-medium">「まとめて生成」を押してください</p>
            <p className="text-xs text-slate-400 mt-2">
              院別ブランド辞書を参照しながら複数媒体を一度に生成します
            </p>
          </div>
        )}

        {/* 出力カード群 */}
        {!loading && outputs && (
          <>
            {/* 生成サマリー */}
            <div className="flex items-center gap-3 mb-4 px-1">
              <p className="text-sm text-slate-600">
                <span className="font-bold text-slate-900">{outputs.length}種類</span> のコンテンツを生成しました
              </p>
              {duration != null && (
                <span className="text-xs text-slate-400">{(duration / 1000).toFixed(1)}秒</span>
              )}
              {outputs.some((o) => o.warnings.length > 0) && (
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  ⚠ チェック項目あり
                </span>
              )}
            </div>

            {/* カードグリッド */}
            <div className="grid grid-cols-2 gap-4">
              {outputs.map((item) => {
                const isHalf = MEDIA_HALF_WIDTH.has(item.mediaType);
                return (
                  <div
                    key={item.mediaType}
                    className={isHalf ? 'col-span-1' : 'col-span-2'}
                  >
                    <MultiOutputCard item={item} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
