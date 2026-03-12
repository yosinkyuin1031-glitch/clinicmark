'use client';

import { useState } from 'react';
import { LayoutTemplate, Sparkles, AlertCircle } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { OutputPreview } from '@/components/generate/OutputPreview';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import type { GeneratedContent } from '@/types';

const SECTION_TYPES = ['ヒーロー', '症状リスト', '施術の流れ', '強み', 'FAQ', 'CTA'] as const;

const SECTION_DESCRIPTIONS: Record<string, string> = {
  'ヒーロー':    'ページ最上部のファーストビュー。キャッチコピー＋CTA',
  '症状リスト':  '「こんなお悩みありませんか？」の共感セクション',
  '施術の流れ':  '来院〜施術〜アフターケアまでのステップ説明',
  '強み':        '他院との差別化ポイント・選ばれる理由',
  'FAQ':         'よくある質問と回答（不安払拭）',
  'CTA':         '予約・問い合わせへ誘導する最終セクション',
};

export default function LpPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  const [sectionType, setSectionType] = useState<string>('ヒーロー');
  const [targetPage,  setTargetPage]  = useState('');
  const [target,      setTarget]      = useState('');
  const [strength,    setStrength]    = useState('');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<{
    content: GeneratedContent;
    inputTokens: number;
    outputTokens: number;
    durationMs: number;
  } | null>(null);
  const [error, setError] = useState('');

  async function handleGenerate() {
    if (!currentClinic || !targetPage.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/generate/lp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicId:    currentClinic.id,
          sectionType,
          targetPage:  targetPage.trim(),
          target:      target.trim(),
          strength:    strength.trim(),
        }),
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
          <LayoutTemplate size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">LPセクション原稿生成</h1>
          <p className="text-sm text-slate-500">ランディングページの各セクションの文章を生成します</p>
        </div>
      </div>

      {/* 注意書き */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <p>医療広告ガイドラインに準拠した表現を使用します。生成後は必ず内容を確認し、必要に応じて編集してください。</p>
      </div>

      {/* 入力フォーム */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-5">
        {/* セクションタイプ */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">セクションタイプ</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SECTION_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSectionType(type)}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm font-medium border-2 transition text-left',
                  sectionType === type
                    ? cn('border-current text-white', color.bg)
                    : 'border-slate-200 text-slate-600 hover:border-slate-300',
                )}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            💡 {SECTION_DESCRIPTIONS[sectionType]}
          </p>
        </div>

        {/* 対象ページ */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            対象ページ・テーマ <span className="text-red-500">*</span>
          </label>
          <input
            value={targetPage}
            onChange={(e) => setTargetPage(e.target.value)}
            placeholder="例: 肩こり専門LP、産後の骨盤矯正ページ、初回限定キャンペーンLP..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        {/* ターゲット */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            ターゲット像 <span className="text-slate-400 font-normal">（任意）</span>
          </label>
          <textarea
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            rows={2}
            placeholder="例: 産後6ヶ月〜1年のママ、デスクワーク中心の30〜40代..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>

        {/* 強み */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            院の強み・差別化ポイント <span className="text-slate-400 font-normal">（任意）</span>
          </label>
          <textarea
            value={strength}
            onChange={(e) => setStrength(e.target.value)}
            rows={2}
            placeholder="例: 産後特化10年の実績、完全個室・女性スタッフ在籍、鍼灸と整体の組み合わせ..."
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !targetPage.trim()}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition',
            loading || !targetPage.trim()
              ? 'bg-slate-300 cursor-not-allowed'
              : cn(color.bg, 'hover:opacity-90'),
          )}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI生成中... （10〜30秒）
            </>
          ) : (
            <>
              <Sparkles size={17} />
              セクション原稿を生成する
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
            canvaDesignType="poster"
          />
        </div>
      )}
    </div>
  );
}
