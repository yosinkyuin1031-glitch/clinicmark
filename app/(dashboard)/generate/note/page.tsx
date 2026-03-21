'use client';

import { useState, useCallback } from 'react';
import {
  Sparkles, Loader2, FileText, Copy, Check,
  ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import {
  NOTE_TYPE_LABELS, NOTE_TYPES,
  type NoteGenInput, type NoteGenResult, type NoteType,
} from '@/types';

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

// ─── タイトル候補カード ──────────────────────────────────
function TitleCandidates({
  titles,
  selected,
  onSelect,
}: {
  titles: string[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">タイトル候補（クリックで選択）</span>
        <CopyButton text={titles[selected]} label="選択中をコピー" />
      </div>
      <div className="space-y-2">
        {titles.map((t, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              'w-full text-left text-sm rounded-lg px-3 py-2.5 border transition leading-relaxed',
              selected === i
                ? 'border-violet-400 bg-violet-50 text-violet-900 font-medium'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50',
            )}
          >
            <span className="text-xs font-bold text-slate-400 mr-2">{i + 1}.</span>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 本文出力エリア ──────────────────────────────────────
function BodyOutput({ body }: { body: string }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">
          本文（Markdown）
          <span className="ml-2 text-slate-400 font-normal">{body.length.toLocaleString()}字</span>
        </span>
        <div className="flex items-center gap-2">
          <CopyButton text={body} />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-600"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <pre className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-4 border border-slate-100 max-h-96 overflow-y-auto">
          {body}
        </pre>
      )}
    </div>
  );
}

// ─── ハッシュタグ出力 ────────────────────────────────────
function HashtagOutput({ hashtags }: { hashtags: string[] }) {
  const text = hashtags.join(' ');
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">ハッシュタグ</span>
        <CopyButton text={text} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {hashtags.map((tag, i) => (
          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── SEOメモ ─────────────────────────────────────────────
function SeoMemoOutput({ memo }: { memo: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-100 rounded-xl p-4 space-y-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold text-slate-500"
      >
        <span>💡 SEO・拡散メモ</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap bg-amber-50 border border-amber-100 rounded-lg p-3">
          {memo}
        </p>
      )}
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────
export default function NoteGeneratePage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // フォーム状態
  const [theme,        setTheme]        = useState('');
  const [noteType,     setNoteType]     = useState<NoteType>('knowledge');
  const [target,       setTarget]       = useState('');
  const [charTarget,   setCharTarget]   = useState(1500);
  const [writingStyle, setWritingStyle] = useState<NoteGenInput['writingStyle']>('friendly');
  const [cta,          setCta]          = useState('');

  // 生成状態
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState<NoteGenResult | null>(null);
  const [error,         setError]         = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState(0);

  const handleGenerate = useCallback(async () => {
    if (!currentClinic || !theme.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedTitle(0);

    try {
      const body: NoteGenInput = {
        clinicId:     currentClinic.id,
        theme:        theme.trim(),
        noteType,
        target:       target.trim(),
        charTarget,
        writingStyle,
        cta:          cta.trim(),
      };

      const res = await fetch('/api/generate/note', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? '生成に失敗しました');
      }

      const data: NoteGenResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [currentClinic, theme, noteType, target, charTarget, writingStyle, cta]);

  const canGenerate = !loading && !!currentClinic && !!theme.trim();

  // 全文テキスト（タイトル＋本文＋ハッシュタグ）
  const fullText = result
    ? [
        result.titles[selectedTitle],
        '',
        result.body,
        '',
        result.hashtags.join(' '),
      ].join('\n')
    : '';

  const WRITING_STYLE_OPTIONS: { value: NoteGenInput['writingStyle']; label: string }[] = [
    { value: 'friendly', label: '親しみやすい' },
    { value: 'formal',   label: 'プロフェッショナル' },
    { value: 'casual',   label: 'カジュアル' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-0">
      {/* ── 左パネル（フォーム） ── */}
      <aside className="w-full md:w-72 shrink-0 md:sticky md:top-0 md:max-h-screen md:overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* タイトル */}
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', color.bg)}>
              <BookOpen size={15} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">note下書き生成</h1>
              <p className="text-xs text-slate-500">コピペで使えるnote記事を作成</p>
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
              placeholder="例: 腰痛、肩こり、姿勢改善"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 記事種類 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">記事の種類</label>
            <div className="space-y-1.5">
              {NOTE_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setNoteType(t)}
                  className={cn(
                    'w-full text-left text-xs py-2 px-3 rounded-lg border transition font-medium',
                    noteType === t
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {NOTE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* ターゲット */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              ターゲット読者（任意）
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="例: 30代女性、デスクワーク族"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* 目標文字数 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-600">目標文字数</label>
              <span className="text-xs font-bold text-slate-700">{charTarget.toLocaleString()}字</span>
            </div>
            <input
              type="range"
              min={800}
              max={3000}
              step={100}
              value={charTarget}
              onChange={(e) => setCharTarget(Number(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-0.5">
              <span>800字</span>
              <span>3,000字</span>
            </div>
          </div>

          {/* 文体 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">文体</label>
            <div className="space-y-1.5">
              {WRITING_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setWritingStyle(opt.value)}
                  className={cn(
                    'w-full text-left text-xs py-1.5 px-3 rounded-lg border transition font-medium',
                    writingStyle === opt.value
                      ? cn('border-transparent text-white', color.bg)
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              CTA（任意）
            </label>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="例: LINEでお気軽にご相談ください"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
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
              : <><Sparkles size={16} />下書きを生成</>
            }
          </button>

          {!theme.trim() && (
            <p className="text-xs text-center text-slate-400">※ テーマを入力してください</p>
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
            <p className="text-sm font-medium">note記事を生成中...</p>
            <p className="text-xs mt-1">ブランド辞書を参照しています</p>
          </div>
        )}

        {!loading && !result && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-20', color.bg)}>
              <FileText size={32} className="text-white" />
            </div>
            <p className="text-slate-500 font-medium">テーマと記事種類を選んで</p>
            <p className="text-slate-500 font-medium">「下書きを生成」を押してください</p>
            <p className="text-xs text-slate-400 mt-2">
              生成後はタイトルを選んで、本文をnoteにコピペするだけ
            </p>
          </div>
        )}

        {!loading && result && (
          <div className="space-y-4">
            {/* サマリーバー */}
            <div className="flex items-center gap-3 px-1">
              <p className="text-sm text-slate-600 flex-1">
                <span className="font-bold text-slate-900">note下書き</span> を生成しました
                {result.durationMs != null && (
                  <span className="text-xs text-slate-400 ml-2">
                    {(result.durationMs / 1000).toFixed(1)}秒
                  </span>
                )}
              </p>
              <CopyButton text={fullText} label="全文コピー" />
            </div>

            {/* タイトル候補 */}
            <TitleCandidates
              titles={result.titles}
              selected={selectedTitle}
              onSelect={setSelectedTitle}
            />

            {/* 本文 */}
            <BodyOutput body={result.body} />

            {/* ハッシュタグ */}
            <HashtagOutput hashtags={result.hashtags} />

            {/* SEOメモ */}
            {result.seoMemo && <SeoMemoOutput memo={result.seoMemo} />}

            {/* ライブラリ保存済みメッセージ */}
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <Check size={14} className="text-green-600 shrink-0" />
              <p className="text-xs text-green-700">
                ライブラリに保存済みです（コンテンツID: <code className="font-mono text-xs">{result.contentId}</code>）
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
