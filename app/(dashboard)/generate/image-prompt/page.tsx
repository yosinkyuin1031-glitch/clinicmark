'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ImageIcon, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import {
  IMAGE_USE_CASE_LABELS, IMAGE_STYLE_LABELS, ASPECT_RATIO_LABELS,
  type ImageUseCase, type ImageStyle, type AspectRatio,
  type ImagePromptInput, type ImagePromptOutput,
} from '@/types';

// ─── 定数 ────────────────────────────────────────────────
const USE_CASES: ImageUseCase[] = ['instagram', 'youtube', 'threads', 'ad'];
const STYLES: ImageStyle[]      = ['photo', 'illustration'];
const RATIOS: AspectRatio[]     = ['16:9', '1:1', '4:5', '9:16'];

const MOOD_OPTIONS = [
  'あたたかみ', '清潔感', 'プロフェッショナル', 'やわらかい', '元気',
];

const BG_OPTIONS = [
  '白背景', '院内', 'グラデーション背景', '屋外・自然', 'シンプルな床・壁',
];

// ─── コピーボタン ────────────────────────────────────────
function CopyButton({ text, label = 'コピー' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      className={cn(
        'flex items-center gap-1 text-xs px-2 py-1 rounded-md transition shrink-0',
        copied
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
      )}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'コピー済み' : label}
    </button>
  );
}

// ─── 出力フィールド ──────────────────────────────────────
function OutputField({
  label, value, mono = false, collapsible = false,
}: {
  label: string; value: string; mono?: boolean; collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div className="flex items-center gap-2">
          <CopyButton text={value} />
          {collapsible && (
            <button
              onClick={() => setOpen(!open)}
              className="text-slate-400 hover:text-slate-600"
            >
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>
      {open && (
        <p className={cn(
          'text-sm text-slate-800 leading-relaxed whitespace-pre-wrap',
          mono && 'font-mono text-xs bg-slate-50 rounded p-3 border border-slate-100',
        )}>
          {value}
        </p>
      )}
    </div>
  );
}

// ─── バリエーション ──────────────────────────────────────
function VariationList({ variations }: { variations: string[] }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-3">
      <span className="text-xs font-semibold text-slate-500">バリエーション案</span>
      <div className="space-y-2 mt-2">
        {variations.map((v, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3">
            <span className="text-xs font-bold text-slate-400 shrink-0 mt-0.5">{i + 1}.</span>
            <p className="text-sm text-slate-700 flex-1 leading-relaxed">{v}</p>
            <CopyButton text={v} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────
export default function ImagePromptPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // フォーム状態
  const [useCase,     setUseCase]     = useState<ImageUseCase>('instagram');
  const [theme,       setTheme]       = useState('');
  const [symptom,     setSymptom]     = useState('');
  const [mood,        setMood]        = useState('あたたかみ');
  const [background,  setBackground]  = useState('白背景');
  const [hasHuman,    setHasHuman]    = useState(true);
  const [style,       setStyle]       = useState<ImageStyle>('photo');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

  // 生成状態
  const [loading,  setLoading]  = useState(false);
  const [output,   setOutput]   = useState<ImagePromptOutput | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!currentClinic || (!theme.trim() && !symptom.trim())) return;

    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const body: ImagePromptInput = {
        clinicId: currentClinic.id,
        useCase,
        theme:       theme.trim(),
        symptom:     symptom.trim(),
        mood,
        background,
        hasHuman,
        style,
        aspectRatio,
      };

      const res = await fetch('/api/generate/image-prompt', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? '生成に失敗しました');
      }

      const data = await res.json();
      setOutput(data.output);
      setDuration(data.durationMs);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = !loading && !!currentClinic && (!!theme.trim() || !!symptom.trim());

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-0">
      {/* ── 左パネル（フォーム） ── */}
      <aside className="w-full md:w-72 shrink-0 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* タイトル */}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.bg)}>
              <ImageIcon size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">画像指示文生成</h1>
              <p className="text-xs text-slate-500">AI画像生成用プロンプトを作成</p>
            </div>
          </div>

          {/* 用途 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">用途</label>
            <div className="grid grid-cols-2 gap-1.5">
              {USE_CASES.map((uc) => (
                <button
                  key={uc}
                  onClick={() => setUseCase(uc)}
                  className={cn(
                    'text-xs py-1.5 px-2 rounded-lg border transition font-medium text-left',
                    useCase === uc
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {IMAGE_USE_CASE_LABELS[uc]}
                </button>
              ))}
            </div>
          </div>

          {/* テーマ */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              テーマ・画像イメージ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例: 笑顔のスタッフ、院内の様子"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 症状（任意） */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">症状（任意）</label>
            <input
              type="text"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="例: 腰痛、肩こり"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 雰囲気 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">雰囲気・トーン</label>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition font-medium',
                    mood === m
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white',
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 背景 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">背景イメージ</label>
            <div className="flex flex-wrap gap-1.5">
              {BG_OPTIONS.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setBackground(bg)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition font-medium',
                    background === bg
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white',
                  )}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* 人物あり・なし */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">人物</label>
            <div className="flex gap-1.5">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => setHasHuman(v)}
                  className={cn(
                    'flex-1 text-xs py-1.5 rounded-lg border transition font-medium',
                    hasHuman === v
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {v ? '人物あり' : '人物なし'}
                </button>
              ))}
            </div>
          </div>

          {/* スタイル */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">スタイル</label>
            <div className="flex gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={cn(
                    'flex-1 text-xs py-1.5 rounded-lg border transition font-medium',
                    style === s
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {IMAGE_STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* アスペクト比 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">アスペクト比</label>
            <div className="grid grid-cols-2 gap-1.5">
              {RATIOS.map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={cn(
                    'text-xs py-1.5 rounded-lg border transition font-medium',
                    aspectRatio === r
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {ASPECT_RATIO_LABELS[r]}
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
              : <><Sparkles size={16} />画像指示文を生成</>
            }
          </button>

          {!theme.trim() && !symptom.trim() && (
            <p className="text-xs text-center text-slate-400">※ テーマまたは症状を入力してください</p>
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
            <p className="text-sm font-medium">画像指示文を生成中...</p>
            <p className="text-xs mt-1">ブランド辞書を参照しています</p>
          </div>
        )}

        {!loading && !output && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-20', color.bg)}>
              <ImageIcon size={32} className="text-white" />
            </div>
            <p className="text-slate-500 font-medium">テーマと用途を選んで</p>
            <p className="text-slate-500 font-medium">「画像指示文を生成」を押してください</p>
            <p className="text-xs text-slate-400 mt-2">
              AI画像生成ツール（Midjourney・DALL·E 等）に貼り付けて使用できます
            </p>
          </div>
        )}

        {!loading && output && (
          <div className="space-y-4">
            {/* サマリー */}
            <div className="flex items-center gap-3 px-1">
              <p className="text-sm text-slate-600 flex-1">
                <span className="font-bold text-slate-900">画像指示文</span> を生成しました
                {duration != null && (
                  <span className="text-xs text-slate-400 ml-2">{(duration / 1000).toFixed(1)}秒</span>
                )}
              </p>
              <CopyButton
                text={[
                  output.mainPrompt,
                  `\n■ NG要素\n${output.ngElements}`,
                  `\n■ テキストなし注記\n${output.noTextNote}`,
                  `\n■ 構図\n${output.compositionGuide}`,
                  `\n■ 色味\n${output.colorDirection}`,
                  `\n■ バリエーション\n${output.variations.map((v, i) => `${i + 1}. ${v}`).join('\n')}`,
                ].join('\n')}
                label="全文コピー"
              />
            </div>

            {/* メインプロンプト */}
            <OutputField label="メイン指示文（AI画像生成ツールに入力）" value={output.mainPrompt} mono />

            {/* 構図・色味 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OutputField label="構図指示" value={output.compositionGuide} />
              <OutputField label="色味・トーン方向" value={output.colorDirection} />
            </div>

            {/* NG要素・テキストなし注記 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <OutputField label="NG要素（含めないもの）" value={output.ngElements} collapsible />
              <OutputField label="テキストなし注記" value={output.noTextNote} collapsible />
            </div>

            {/* バリエーション */}
            <VariationList variations={output.variations} />
          </div>
        )}
      </div>
    </div>
  );
}
