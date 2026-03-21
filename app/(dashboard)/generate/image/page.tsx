'use client';

import { useState } from 'react';
import {
  Image as ImageIcon, Sparkles, Loader2, Copy, Check,
  Palette, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';

// ─── 型定義 ──────────────────────────────────────────────
type UseCase     = 'instagram_post' | 'instagram_story' | 'youtube_thumb' | 'threads' | 'meta_ad';
type ImageStyle  = 'illustration' | 'photorealistic' | 'minimal' | 'pop' | 'japanese';
type AspectRatio = '1:1' | '9:16' | '16:9' | '4:5';
type ColorTone   = 'warm' | 'cool' | 'pastel' | 'monotone' | 'brand';
type Background  = 'white' | 'clinic' | 'nature' | 'gradient' | 'texture';

interface ImageGenOutput {
  mainPromptJa:     string;
  mainPromptEn:     string;
  negativePrompt:   string;
  compositionGuide: string;
  colorPalette:     string[];
  colorDescription: string;
  variations:       string[];
}

// ─── 選択肢定数 ─────────────────────────────────────────
const USE_CASES: { value: UseCase; label: string; ratio: AspectRatio }[] = [
  { value: 'instagram_post',  label: 'Instagram投稿',        ratio: '1:1'  },
  { value: 'instagram_story', label: 'Instagramストーリーズ', ratio: '9:16' },
  { value: 'youtube_thumb',   label: 'YouTubeサムネイル',     ratio: '16:9' },
  { value: 'threads',         label: 'Threads投稿',          ratio: '1:1'  },
  { value: 'meta_ad',         label: 'Meta広告バナー',        ratio: '16:9' },
];

const IMAGE_STYLES: { value: ImageStyle; label: string }[] = [
  { value: 'illustration',  label: 'イラスト' },
  { value: 'photorealistic', label: 'フォトリアル' },
  { value: 'minimal',       label: 'ミニマル' },
  { value: 'pop',           label: 'ポップ' },
  { value: 'japanese',      label: '和風' },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string; desc: string }[] = [
  { value: '1:1',  label: '1:1',  desc: 'Instagram' },
  { value: '9:16', label: '9:16', desc: 'ストーリーズ' },
  { value: '16:9', label: '16:9', desc: 'YouTube' },
  { value: '4:5',  label: '4:5',  desc: 'フィード' },
];

const COLOR_TONES: { value: ColorTone; label: string }[] = [
  { value: 'warm',     label: '暖色系' },
  { value: 'cool',     label: '寒色系' },
  { value: 'pastel',   label: 'パステル' },
  { value: 'monotone', label: 'モノトーン' },
  { value: 'brand',    label: 'ブランドカラー' },
];

const BACKGROUNDS: { value: Background; label: string }[] = [
  { value: 'white',    label: '白背景' },
  { value: 'clinic',   label: '院内' },
  { value: 'nature',   label: '自然' },
  { value: 'gradient', label: 'グラデーション' },
  { value: 'texture',  label: 'テクスチャ' },
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

// ─── カラーパレット表示 ──────────────────────────────────
function ColorPaletteDisplay({ colors, description }: { colors: string[]; description: string }) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const handleCopy = async (hex: string, idx: number) => {
    await navigator.clipboard.writeText(hex);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Palette size={14} className="text-slate-400" />
        <span className="text-xs font-semibold text-slate-500">カラーパレット</span>
      </div>
      <div className="flex gap-2">
        {colors.map((hex, i) => (
          <button
            key={i}
            onClick={() => handleCopy(hex, i)}
            className="group flex flex-col items-center gap-1"
            title={hex}
          >
            <div
              className="w-12 h-12 rounded-lg border border-slate-200 shadow-sm transition group-hover:scale-110 group-hover:shadow-md"
              style={{ backgroundColor: hex }}
            />
            <span className="text-[10px] text-slate-400 font-mono">
              {copiedIdx === i ? 'Copied!' : hex}
            </span>
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}

// ─── バリエーション ──────────────────────────────────────
function VariationList({ variations }: { variations: string[] }) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-3">
      <span className="text-xs font-semibold text-slate-500">バリエーション（英語プロンプト）</span>
      <div className="space-y-2 mt-2">
        {variations.map((v, i) => (
          <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3">
            <span className="text-xs font-bold text-slate-400 shrink-0 mt-0.5">{i + 1}.</span>
            <p className="text-xs text-slate-700 flex-1 leading-relaxed font-mono break-all">{v}</p>
            <CopyButton text={v} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── チップ選択ボタン ────────────────────────────────────
function ChipButton({
  selected, label, onClick, colorBg,
}: {
  selected: boolean; label: string; onClick: () => void; colorBg: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs px-2.5 py-1.5 rounded-lg border transition font-medium',
        selected
          ? cn('border-transparent text-white', colorBg)
          : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white',
      )}
    >
      {label}
    </button>
  );
}

// ─── メインページ ────────────────────────────────────────
export default function ImageGeneratePage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // フォーム状態
  const [useCase,     setUseCase]     = useState<UseCase>('instagram_post');
  const [theme,       setTheme]       = useState('');
  const [imageStyle,  setImageStyle]  = useState<ImageStyle>('photorealistic');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [colorTone,   setColorTone]   = useState<ColorTone>('warm');
  const [overlayText, setOverlayText] = useState('');
  const [hasHuman,    setHasHuman]    = useState(true);
  const [background,  setBackground]  = useState<Background>('white');
  const [extraNotes,  setExtraNotes]  = useState('');

  // 生成状態
  const [loading,  setLoading]  = useState(false);
  const [output,   setOutput]   = useState<ImageGenOutput | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // 用途変更時にアスペクト比を自動連動
  const handleUseCaseChange = (uc: UseCase) => {
    setUseCase(uc);
    const match = USE_CASES.find(u => u.value === uc);
    if (match) setAspectRatio(match.ratio);
  };

  const handleGenerate = async () => {
    if (!currentClinic || !theme.trim()) return;

    setLoading(true);
    setError(null);
    setOutput(null);

    try {
      const res = await fetch('/api/generate/image', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId:    currentClinic.id,
          useCase,
          theme:       theme.trim(),
          imageStyle,
          aspectRatio,
          colorTone,
          overlayText: overlayText.trim(),
          hasHuman,
          background,
          extraNotes:  extraNotes.trim(),
        }),
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

  const canGenerate = !loading && !!currentClinic && !!theme.trim();

  if (!currentClinic) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        院を選択してください
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-0">
      {/* ── 左パネル（入力フォーム） ── */}
      <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* タイトル */}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.bg)}>
              <ImageIcon size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">AI画像生成</h1>
              <p className="text-xs text-slate-500">SNS投稿用の画像プロンプトを作成</p>
            </div>
          </div>

          {/* 用途選択 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">用途選択</label>
            <div className="grid grid-cols-1 gap-1.5">
              {USE_CASES.map(({ value, label }) => (
                <ChipButton
                  key={value}
                  selected={useCase === value}
                  label={label}
                  onClick={() => handleUseCaseChange(value)}
                  colorBg={color.bg}
                />
              ))}
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
              placeholder="例: 腰痛改善, 産後ケア, 院内の雰囲気"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 画像スタイル */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">画像スタイル</label>
            <div className="flex flex-wrap gap-1.5">
              {IMAGE_STYLES.map(({ value, label }) => (
                <ChipButton
                  key={value}
                  selected={imageStyle === value}
                  label={label}
                  onClick={() => setImageStyle(value)}
                  colorBg={color.bg}
                />
              ))}
            </div>
          </div>

          {/* アスペクト比 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">アスペクト比</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ASPECT_RATIOS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setAspectRatio(value)}
                  className={cn(
                    'text-xs py-1.5 px-2 rounded-lg border transition font-medium text-left',
                    aspectRatio === value
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <span className="block font-bold">{label}</span>
                  <span className={cn('text-[10px]', aspectRatio === value ? 'text-white/70' : 'text-slate-400')}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* カラートーン */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">カラートーン</label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_TONES.map(({ value, label }) => (
                <ChipButton
                  key={value}
                  selected={colorTone === value}
                  label={label}
                  onClick={() => setColorTone(value)}
                  colorBg={color.bg}
                />
              ))}
            </div>
          </div>

          {/* テキスト挿入 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              テキスト挿入 <span className="text-slate-400 font-normal">（任意）</span>
            </label>
            <input
              type="text"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="例: 今なら初回50%OFF"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 人物 あり/なし */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">人物</label>
            <div className="flex gap-1.5">
              {([true, false] as const).map((v) => (
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
                  {v ? 'あり' : 'なし'}
                </button>
              ))}
            </div>
          </div>

          {/* 背景 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">背景</label>
            <div className="flex flex-wrap gap-1.5">
              {BACKGROUNDS.map(({ value, label }) => (
                <ChipButton
                  key={value}
                  selected={background === value}
                  label={label}
                  onClick={() => setBackground(value)}
                  colorBg={color.bg}
                />
              ))}
            </div>
          </div>

          {/* 追加指示 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              追加指示 <span className="text-slate-400 font-normal">（任意）</span>
            </label>
            <textarea
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="例: 桜の季節感を出したい、明るく前向きな印象に"
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
              : <><Sparkles size={16} />画像プロンプトを生成</>
            }
          </button>

          {!theme.trim() && (
            <p className="text-xs text-center text-slate-400">※ テーマを入力してください</p>
          )}
        </div>
      </aside>

      {/* ── 右パネル（出力） ── */}
      <div className="flex-1 min-w-0">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 size={36} className="animate-spin mb-4" />
            <p className="text-sm font-medium">画像プロンプトを生成中...</p>
            <p className="text-xs mt-1">ブランド情報を参照して最適なプロンプトを構築しています</p>
          </div>
        )}

        {!loading && !output && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-20', color.bg)}>
              <ImageIcon size={32} className="text-white" />
            </div>
            <p className="text-slate-500 font-medium">テーマと用途を選んで</p>
            <p className="text-slate-500 font-medium">「画像プロンプトを生成」を押してください</p>
            <p className="text-xs text-slate-400 mt-3 max-w-sm">
              Midjourney / DALL-E / Stable Diffusion などの
              AI画像生成ツールに貼り付けて使用できるプロンプトを生成します
            </p>
          </div>
        )}

        {!loading && output && (
          <div className="space-y-4">
            {/* サマリーヘッダ */}
            <div className="flex items-center gap-3 px-1">
              <p className="text-sm text-slate-600 flex-1">
                <span className="font-bold text-slate-900">画像プロンプト</span> を生成しました
                {duration != null && (
                  <span className="text-xs text-slate-400 ml-2">{(duration / 1000).toFixed(1)}秒</span>
                )}
              </p>
              <CopyButton
                text={[
                  '--- Main Prompt (EN) ---',
                  output.mainPromptEn,
                  '\n--- Negative Prompt ---',
                  output.negativePrompt,
                  '\n--- 日本語説明 ---',
                  output.mainPromptJa,
                ].join('\n')}
                label="全文コピー"
              />
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
              >
                <RefreshCw size={10} />
                再生成
              </button>
            </div>

            {/* メインプロンプト（英語） */}
            <OutputField
              label="メインプロンプト（英語 - AI画像生成ツールに入力）"
              value={output.mainPromptEn}
              mono
            />

            {/* ネガティブプロンプト */}
            <OutputField
              label="ネガティブプロンプト（除外要素）"
              value={output.negativePrompt}
              mono
            />

            {/* 日本語説明 */}
            <OutputField
              label="日本語説明（内容確認用）"
              value={output.mainPromptJa}
              collapsible
            />

            {/* 構図ガイド */}
            <OutputField
              label="構図ガイド"
              value={output.compositionGuide}
            />

            {/* カラーパレット */}
            <ColorPaletteDisplay
              colors={output.colorPalette}
              description={output.colorDescription}
            />

            {/* バリエーション */}
            <VariationList variations={output.variations} />

            {/* 使い方ヒント */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-500">使い方のヒント</span>
              <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
                <li>「メインプロンプト」をコピーして Midjourney / DALL-E / Stable Diffusion に貼り付け</li>
                <li>「ネガティブプロンプト」は Stable Diffusion の Negative Prompt 欄に入力</li>
                <li>Midjourney の場合は --no の後にネガティブプロンプトを追加</li>
                <li>バリエーションを使って複数パターンを試すと、より良い画像が見つかります</li>
                <li>テキスト挿入が必要な場合は Canva などのデザインツールで後から追加してください</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
