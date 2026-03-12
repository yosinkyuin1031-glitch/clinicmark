'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ImageIcon, Palette, Wand2, Upload, ExternalLink,
  Download, AlertCircle, Loader2, Check, X, RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';

type Tab = 'canva' | 'ai';
type AiModel = string;

// ─── 画像サイズオプション ─────────────────────────────────
const SIZE_OPTIONS = [
  { value: '1024x1024', label: '1:1 正方形',     desc: 'Instagram / SNS' },
  { value: '1792x1024', label: '16:9 横長',       desc: 'チラシ / バナー' },
  { value: '1024x1792', label: '9:16 縦長',       desc: 'ストーリーズ / チラシ' },
];

// ─── AIモデル型（API レスポンスと共通） ───────────────────
interface ModelOption {
  value:        string;
  label:        string;
  badge:        string;
  desc:         string;
  envKey:       string;
  apiModel:     string;
  available:    boolean;
  supportsEdit: boolean;
}

// ─── フォールバック（API 取得失敗時） ─────────────────────
const FALLBACK_MODELS: ModelOption[] = [
  {
    value: 'openai', label: 'OpenAI', badge: 'gpt-image-1',
    desc: '高品質・安定した画像生成', envKey: 'OPENAI_API_KEY',
    apiModel: 'gpt-image-1', available: true, supportsEdit: true,
  },
  {
    value: 'gemini', label: 'Nano Banana Pro', badge: 'Gemini',
    desc: '日本語テキスト描画が得意・最新Geminiモデル', envKey: 'GEMINI_API_KEY',
    apiModel: 'gemini-2.0-flash-preview-image-generation', available: true, supportsEdit: true,
  },
];

// ─── Canva 編集結果型 ──────────────────────────────────────
interface CanvaResult {
  editUrl:      string;
  editPlan:     string;
  designId:     string;
  designTitle?: string | null;
  pageCount?:   number | null;
}

// ─── AI 生成結果型 ─────────────────────────────────────────
interface AiResult {
  imageUrl?:    string | null;
  imageBase64?: string | null;
  imageMime?:   string | null;
  mode:         'edit' | 'generate' | 'mock';
  model?:       'openai' | 'gemini';
  prompt:       string;
  message?:     string;
}

export default function ImageRemixPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');
  const [activeTab, setActiveTab] = useState<Tab>('canva');

  // ── AIモデル動的取得 ─────────────────────────────────────
  const [modelOptions, setModelOptions] = useState<ModelOption[]>(FALLBACK_MODELS);

  useEffect(() => {
    fetch('/api/config/ai-models')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.imageModels?.length) {
          setModelOptions(data.imageModels);
        }
      })
      .catch(() => {/* フォールバックを使い続ける */});
  }, []);

  // ── Canva タブ状態 ──────────────────────────────────────
  const [canvaUrl,          setCanvaUrl]          = useState('');
  const [canvaInstructions, setCanvaInstructions] = useState('');
  const [canvaLoading,      setCanvaLoading]      = useState(false);
  const [canvaResult,       setCanvaResult]       = useState<CanvaResult | null>(null);
  const [canvaError,        setCanvaError]        = useState('');

  // ── AI タブ状態 ─────────────────────────────────────────
  const [aiImage,        setAiImage]        = useState<File | null>(null);
  const [aiPreviewUrl,   setAiPreviewUrl]   = useState<string | null>(null);
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiSize,         setAiSize]         = useState('1024x1024');
  const [aiModel,        setAiModel]        = useState<AiModel>('openai');
  const [aiLoading,      setAiLoading]      = useState(false);
  const [aiResult,       setAiResult]       = useState<AiResult | null>(null);
  const [aiError,        setAiError]        = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── ファイル選択ハンドラ ───────────────────────────────
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setAiImage(file);
    const url = URL.createObjectURL(file);
    setAiPreviewUrl(url);
    setAiResult(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // ── Canva 送信 ──────────────────────────────────────────
  async function handleCanvaSubmit() {
    if (!canvaUrl.trim() || !canvaInstructions.trim()) return;
    setCanvaLoading(true);
    setCanvaError('');
    setCanvaResult(null);

    try {
      const res = await fetch('/api/tools/image-remix/canva', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ canvaUrl: canvaUrl.trim(), instructions: canvaInstructions.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? '処理に失敗しました');
      }
      setCanvaResult(await res.json());
    } catch (e) {
      setCanvaError(e instanceof Error ? e.message : '予期しないエラーが発生しました');
    } finally {
      setCanvaLoading(false);
    }
  }

  // ── AI 生成送信 ─────────────────────────────────────────
  async function handleAiSubmit() {
    if (!aiInstructions.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);

    try {
      const body = new FormData();
      body.append('instructions', aiInstructions.trim());
      body.append('size', aiSize);
      body.append('model', aiModel);
      if (aiImage) body.append('image', aiImage);

      const res = await fetch('/api/tools/image-remix/generate', {
        method: 'POST',
        body,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? '生成に失敗しました');
      }
      setAiResult(await res.json());
    } catch (e) {
      setAiError(e instanceof Error ? e.message : '予期しないエラーが発生しました');
    } finally {
      setAiLoading(false);
    }
  }

  // ── 画像ダウンロード ────────────────────────────────────
  function handleDownload(src: string) {
    const a = document.createElement('a');
    if (src.startsWith('data:')) {
      a.href = src;
    } else {
      a.href = src;
      a.target = '_blank';
    }
    a.download = `clinicmark-image-${Date.now()}.png`;
    a.click();
  }

  if (!currentClinic) {
    return <div className="flex items-center justify-center h-64 text-slate-400">院を選択してください</div>;
  }

  const imageSrc = aiResult?.imageBase64
    ? `data:${aiResult.imageMime ?? 'image/png'};base64,${aiResult.imageBase64}`
    : aiResult?.imageUrl ?? null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
          <ImageIcon size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">画像リミックス</h1>
          <p className="text-sm text-slate-500">既存画像の変更指示で新しいデザインを生成・編集します</p>
        </div>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6">
        {([
          { id: 'canva', label: 'Canvaデザイン編集', icon: Palette,
            desc: 'URLを貼るだけ・テキスト/画像の差し替え指示' },
          { id: 'ai',    label: 'AI画像生成',        icon: Wand2,
            desc: '画像をアップして内容を変更 / ゼロから生成' },
        ] as const).map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 px-4 py-3 rounded-lg text-sm transition',
              activeTab === id
                ? cn('bg-white shadow-sm font-semibold', color.text)
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <div className="flex items-center gap-1.5">
              <Icon size={15} />
              <span>{label}</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">{desc}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════ CANVA タブ ══════════════════════════ */}
      {activeTab === 'canva' && (
        <div className="space-y-5">
          {/* 説明 */}
          <div className="flex items-start gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 text-sm text-purple-800">
            <Palette size={16} className="mt-0.5 shrink-0" />
            <p>CanvaのデザインURLを貼り付けて変更内容を指示すると、AIが具体的な編集手順を生成しCanvaを開きます。</p>
          </div>

          {/* フォーム */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            {/* Canva URL */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                CanvaデザインURL <span className="text-red-500">*</span>
              </label>
              <input
                value={canvaUrl}
                onChange={(e) => setCanvaUrl(e.target.value)}
                placeholder="https://www.canva.com/design/DABcde.../edit"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="mt-1.5 text-xs text-slate-400">CanvaでデザインURLをコピー（右上の「共有」→「リンクをコピー」）</p>
            </div>

            {/* 変更指示 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                変更内容の指示 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={canvaInstructions}
                onChange={(e) => setCanvaInstructions(e.target.value)}
                rows={4}
                placeholder={`例：
・キャッチコピーを「腰痛専門院」から「肩こり専門院」に変更
・メインの写真を院内の写真に差し替えたい
・背景色を白にして、フォントを太くしたい`}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              />
            </div>

            {/* 送信ボタン */}
            <button
              onClick={handleCanvaSubmit}
              disabled={canvaLoading || !canvaUrl.trim() || !canvaInstructions.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition',
                canvaLoading || !canvaUrl.trim() || !canvaInstructions.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : cn(color.bg, 'hover:opacity-90'),
              )}
            >
              {canvaLoading
                ? <><Loader2 size={16} className="animate-spin" />編集プランを生成中...</>
                : <><Palette size={16} />Canvaで編集プランを生成</>}
            </button>
          </div>

          {/* エラー */}
          {canvaError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {canvaError}
            </div>
          )}

          {/* 結果 */}
          {canvaResult && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {/* 結果ヘッダー */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                <div>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Check size={15} className="text-green-600" />
                    編集プラン生成完了
                  </p>
                  {canvaResult.designTitle && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      デザイン: {canvaResult.designTitle}
                      {canvaResult.pageCount ? ` (${canvaResult.pageCount}ページ)` : ''}
                    </p>
                  )}
                </div>
                <a
                  href={canvaResult.editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition',
                    color.bg, 'hover:opacity-90',
                  )}
                >
                  <ExternalLink size={14} />
                  Canvaで開く
                </a>
              </div>

              {/* 編集手順 */}
              <div className="p-5">
                <div className="flex items-center gap-1.5 mb-3 text-sm font-semibold text-slate-700">
                  <ClipboardList size={15} />
                  Canvaでの操作手順
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                    {canvaResult.editPlan}
                  </pre>
                </div>
                <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                  <AlertCircle size={11} />
                  上の「Canvaで開く」ボタンから編集ページを開き、手順に従って作業してください
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ AI タブ ══════════════════════════ */}
      {activeTab === 'ai' && (
        <div className="space-y-5">
          {/* 説明 */}
          <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <Wand2 size={16} className="mt-0.5 shrink-0" />
            <p>
              元画像をアップロードして変更指示を入力 → AIが新しい画像を生成します。
              画像なしでも「チラシを新規作成」などで生成できます。
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            {/* モデル選択 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">使用するAIモデル</label>
              <div className="grid grid-cols-2 gap-2">
                {modelOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setAiModel(opt.value); setAiResult(null); setAiError(''); }}
                    className={cn(
                      'flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl border-2 text-left transition',
                      aiModel === opt.value
                        ? cn('border-transparent text-white', color.bg)
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="font-semibold text-sm">{opt.label}</span>
                      <span className={cn(
                        'ml-auto text-xs px-1.5 py-0.5 rounded font-mono',
                        aiModel === opt.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                      )}>
                        {opt.badge}
                      </span>
                    </div>
                    <span className={cn('text-xs', aiModel === opt.value ? 'text-white/80' : 'text-slate-400')}>
                      {opt.desc}
                    </span>
                    <span className={cn('text-xs mt-0.5 font-mono', aiModel === opt.value ? 'text-white/60' : 'text-slate-300')}>
                      {opt.envKey}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {/* 元画像アップロード */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                元画像 <span className="text-slate-400 font-normal">（任意 – 変更元の画像）</span>
              </label>

              {aiPreviewUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={aiPreviewUrl}
                    alt="アップロード画像"
                    className="w-full max-h-48 object-contain rounded-xl border border-slate-200 bg-slate-50"
                  />
                  <button
                    onClick={() => { setAiImage(null); setAiPreviewUrl(null); setAiResult(null); }}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-red-500 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition',
                    isDragging
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50',
                  )}
                >
                  <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500">クリックまたはドラッグ＆ドロップで画像を選択</p>
                  <p className="text-xs text-slate-400 mt-1">PNG / JPG / WebP (最大20MB)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>

            {/* 変更・生成指示 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                変更内容 / 生成指示 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                rows={4}
                placeholder={aiImage
                  ? `例：
・背景を白に変更して清潔感を出す
・右下にある電話番号を削除して
・メインの写真を外でストレッチしている画像に`
                  : `例：
・腰痛専門院のA4チラシ。青と白をメインカラーに
・「初回無料カウンセリング実施中」のInstagram投稿画像
・落ち着いた和モダンなLINEバナー（横長）`}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
              />
            </div>

            {/* サイズ選択 */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">出力サイズ</label>
              <div className="grid grid-cols-3 gap-2">
                {SIZE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAiSize(opt.value)}
                    className={cn(
                      'py-2.5 px-3 text-sm rounded-lg border transition text-center',
                      aiSize === opt.value
                        ? cn('border-transparent text-white', color.bg)
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                    )}
                  >
                    <p className="font-medium">{opt.label}</p>
                    <p className={cn('text-xs mt-0.5', aiSize === opt.value ? 'text-white/80' : 'text-slate-400')}>
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 生成ボタン */}
            <button
              onClick={handleAiSubmit}
              disabled={aiLoading || !aiInstructions.trim()}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition',
                aiLoading || !aiInstructions.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : cn(color.bg, 'hover:opacity-90'),
              )}
            >
              {aiLoading ? (
                <><Loader2 size={16} className="animate-spin" />{aiImage ? '画像を編集中...' : '画像を生成中...'}</>
              ) : (
                <><Wand2 size={16} />{aiImage ? 'AIで画像を編集する' : 'AIで画像を生成する'}</>
              )}
            </button>
          </div>

          {/* エラー */}
          {aiError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {aiError}
            </div>
          )}

          {/* 結果 */}
          {aiResult && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {aiResult.mode === 'mock' ? (
                /* モックモード */
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={16} className="text-amber-500" />
                    <p className="text-sm font-semibold text-slate-700">モックモード（API未設定）</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    {aiResult.message}
                  </div>
                  <div className="mt-4 bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">送信されるプロンプト:</p>
                    <p className="text-sm text-slate-700">{aiResult.prompt}</p>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl text-sm text-blue-800">
                    <p className="font-semibold mb-1">有効化手順:</p>
                    <code className="block bg-blue-100 rounded px-3 py-2 text-xs font-mono">
                      {aiResult.model === 'gemini'
                        ? 'GEMINI_API_KEY=AIza... を .env に追加してください'
                        : 'OPENAI_API_KEY=sk-... を .env に追加してください'}
                    </code>
                  </div>
                </div>
              ) : (
                /* 生成成功 */
                <>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <Check size={15} className="text-green-600" />
                      {aiResult.mode === 'edit' ? '画像編集完了' : '画像生成完了'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAiSubmit}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                      >
                        <RefreshCw size={12} /> 再生成
                      </button>
                      {imageSrc && (
                        <button
                          onClick={() => handleDownload(imageSrc)}
                          className={cn(
                            'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg text-white transition',
                            color.bg, 'hover:opacity-90',
                          )}
                        >
                          <Download size={12} /> ダウンロード
                        </button>
                      )}
                    </div>
                  </div>
                  {imageSrc ? (
                    <div className="p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageSrc}
                        alt="AI生成画像"
                        className="w-full rounded-xl border border-slate-100"
                      />
                    </div>
                  ) : (
                    <div className="p-5 text-center text-sm text-slate-500">
                      画像URLの取得に失敗しました。再生成してみてください。
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
