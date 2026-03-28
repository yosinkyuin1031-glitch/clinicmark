'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, BookOpen, RefreshCw, Save, Download, Check, Brain } from 'lucide-react';
import { useClinic } from '@/contexts/ClinicContext';
import { DictionaryCard } from '@/components/brand/DictionaryCard';
import {
  BrandCategory,
  BRAND_CATEGORY_LABELS,
  type BrandEntry,
  type ClinicBrandProfile,
  type ClinicBrandProfileInput,
} from '@/types';
import { getClinicColor, cn } from '@/lib/utils/clinic';
import { PageSkeleton } from '@/components/ui/Skeleton';

// ─── タブ定義 ─────────────────────────────────────────
type ActiveTab = 'PROFILE' | BrandCategory;

// ブランド設定カテゴリ（既存）
const BRAND_CATEGORIES: BrandCategory[] = ['TONE', 'TARGET', 'SERVICE', 'KEYWORD', 'TAGLINE', 'NG_WORD'];
// 蓄積ナレッジカテゴリ（新規）
const KNOWLEDGE_CATEGORIES: BrandCategory[] = ['PATIENT_VOICE', 'SUCCESS_CASE', 'CLINIC_MEMO'];

const CATEGORY_DESCRIPTION: Record<BrandCategory, string> = {
  TONE:          'AIがコンテンツを生成する際の文体・雰囲気の基準になります',
  TARGET:        'どんな患者さんに向けて発信するかの基準になります',
  SERVICE:       '当院の強みや施術メニューを記録します',
  KEYWORD:       'SEO・MEOで狙うキーワードを記録します',
  TAGLINE:       '広告・SNS・HPで使うキャッチコピーを管理します',
  NG_WORD:       '法的・ブランド的に使ってはいけない表現を記録します',
  PATIENT_VOICE: '患者様から実際にいただいた声や口コミを記録します。コンテンツ生成時に「患者様の声」として自動参照されます',
  SUCCESS_CASE:  '症状改善・施術成功の事例を記録します。FAQやブログ・Instagram台本に活用されます',
  CLINIC_MEMO:   '季節のメニュー・新しい施術法・お知らせなど、その時々の特記事項を記録します',
};

// カテゴリごとの入力プレースホルダー
const CATEGORY_PLACEHOLDER: Record<BrandCategory, { key: string; value: string }> = {
  TONE:          { key: 'トーン名',    value: 'やわらかく親しみやすい口調で、専門用語は避ける' },
  TARGET:        { key: 'ターゲット名', value: '30〜50代のデスクワーク中心の腰痛持ち女性' },
  SERVICE:       { key: 'サービス名',  value: '神経整体（独自メソッドで神経・筋肉・骨格を同時アプローチ）' },
  KEYWORD:       { key: 'キーワード',  value: '腰痛 大口町 根本改善' },
  TAGLINE:       { key: 'タグライン名', value: '「その腰痛、我慢しなくていい」' },
  NG_WORD:       { key: 'NG表現',      value: '完治します / 必ず治る / 100%効果あり' },
  PATIENT_VOICE: { key: '患者属性（例: 40代女性）', value: '3回の施術で10年以上悩んでいた腰痛がほぼなくなりました。先生の説明が丁寧で安心できました。' },
  SUCCESS_CASE:  { key: '症状・属性（例: ヘルニア 50代男性）', value: '術後リハビリで来院。6回の施術と自宅エクササイズで日常動作がほぼ正常に回復。' },
  CLINIC_MEMO:   { key: 'メモのタイトル（例: 春の特別メニュー）', value: '4〜5月限定で花粉症による首こり・頭痛に特化したコースを提供中（通常より20分長め）' },
};

// ─── プロフィールフォームの初期値 ─────────────────────
const EMPTY_PROFILE: ClinicBrandProfileInput = {
  description: '', brandTone: '', primaryKeywords: '', areaKeywords: '',
  greeting: '', ctaText: '', recommendedPhrases: '', forbiddenPhrases: '', notes: '',
};

// ─── フォームフィールド定義 ───────────────────────────
const PROFILE_FIELDS: {
  key: keyof ClinicBrandProfileInput;
  label: string;
  hint: string;
  rows: number;
  placeholder: string;
}[] = [
  {
    key: 'description',
    label: '院の説明',
    hint: '院の特徴・専門性・場所などを簡潔に',
    rows: 3,
    placeholder: '例: 名古屋市大口町にある神経整体専門院。腰痛・肩こり・頭痛に特化した独自メソッドで施術を提供。',
  },
  {
    key: 'brandTone',
    label: 'ブランドトーン',
    hint: 'AIが文章を書く際の雰囲気・スタイルの基準',
    rows: 2,
    placeholder: '例: 親しみやすく、専門的すぎない。患者さん目線で分かりやすく。',
  },
  {
    key: 'primaryKeywords',
    label: '主要キーワード',
    hint: '1行に1キーワードで入力（SEO・MEO対策で狙うワード）',
    rows: 4,
    placeholder: '神経整体\n腰痛改善\n肩こり解消\nデスクワーク',
  },
  {
    key: 'areaKeywords',
    label: '地域キーワード',
    hint: '1行に1キーワードで入力（エリア・駅名など）',
    rows: 3,
    placeholder: '大口町\n江南市\n名古屋市北区',
  },
  {
    key: 'greeting',
    label: '固定挨拶文',
    hint: '院からの定型挨拶文。コンテンツの冒頭や結びに使用',
    rows: 2,
    placeholder: '例: いつも大口神経整体院をご利用いただきありがとうございます。',
  },
  {
    key: 'ctaText',
    label: 'CTA文（行動喚起）',
    hint: '予約・問い合わせへの誘導文句',
    rows: 1,
    placeholder: '例: ご予約・お問い合わせは今すぐこちらから｜当日予約OK',
  },
  {
    key: 'recommendedPhrases',
    label: '推奨表現',
    hint: '1行に1フレーズで入力（積極的に使いたい言い回し）',
    rows: 4,
    placeholder: 'お身体のケア\n根本から見直す\nご自身のペースで\n丁寧なカウンセリング',
  },
  {
    key: 'forbiddenPhrases',
    label: '禁止表現',
    hint: '1行に1フレーズで入力（法的・ブランド的にNGなワード）',
    rows: 3,
    placeholder: '完治\n治ります\n必ず効果が出ます\n100%改善',
  },
  {
    key: 'notes',
    label: '備考',
    hint: '料金・営業時間・特記事項など',
    rows: 2,
    placeholder: '例: 初回限定割引あり。完全予約制。駐車場6台。',
  },
];

// ─── ページ本体 ────────────────────────────────────────
export default function BrandPage() {
  const { currentClinic } = useClinic();
  const color = currentClinic ? getClinicColor(currentClinic.slug) : getClinicColor('');

  // タブ
  const [activeTab, setActiveTab] = useState<ActiveTab>('PROFILE');

  // BrandEntry 関連
  const [entries, setEntries]           = useState<BrandEntry[]>([]);
  const [loading, setLoading]           = useState(false);
  const [adding, setAdding]             = useState(false);
  const [newKey, setNewKey]             = useState('');
  const [newValue, setNewValue]         = useState('');

  // プロフィール関連
  const [profile, setProfile]     = useState<ClinicBrandProfileInput>(EMPTY_PROFILE);
  const [profLoading, setProfLoading] = useState(false);
  const [profSaving, setProfSaving]   = useState(false);
  const [profSaved, setProfSaved]     = useState(false);

  // ─── BrandEntry 取得 ─────────────────────────────────
  const fetchEntries = useCallback(async () => {
    if (!currentClinic) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/brand?clinicId=${currentClinic.id}`);
      const json = await res.json();
      setEntries(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [currentClinic]);

  // ─── プロフィール取得 ─────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!currentClinic) return;
    setProfLoading(true);
    try {
      const res = await fetch(`/api/brand-profile?clinicId=${currentClinic.id}`);
      if (res.ok) {
        const data: ClinicBrandProfile = await res.json();
        setProfile({
          description:        data.description,
          brandTone:          data.brandTone,
          primaryKeywords:    data.primaryKeywords,
          areaKeywords:       data.areaKeywords,
          greeting:           data.greeting,
          ctaText:            data.ctaText,
          recommendedPhrases: data.recommendedPhrases,
          forbiddenPhrases:   data.forbiddenPhrases,
          notes:              data.notes,
        });
      }
    } finally {
      setProfLoading(false);
    }
  }, [currentClinic]);

  useEffect(() => {
    fetchEntries();
    fetchProfile();
    setActiveTab('PROFILE');
    setAdding(false);
    setProfSaved(false);
  }, [fetchEntries, fetchProfile]);

  // ─── プロフィール保存 ─────────────────────────────────
  async function handleSaveProfile() {
    if (!currentClinic) return;
    setProfSaving(true);
    try {
      await fetch('/api/brand-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicId: currentClinic.id, ...profile }),
      });
      setProfSaved(true);
      setTimeout(() => setProfSaved(false), 2500);
    } finally {
      setProfSaving(false);
    }
  }

  // ─── JSON エクスポート ───────────────────────────────
  async function handleExportJson() {
    if (!currentClinic) return;
    const res = await fetch(
      `/api/brand-profile?clinicId=${currentClinic.id}&export=json`,
    );
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `clinicmark-brand-${currentClinic.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── BrandEntry CRUD ─────────────────────────────────
  const activeCategory = activeTab as BrandCategory;
  const filteredEntries = entries.filter((e) => e.category === activeCategory);

  async function handleAdd() {
    if (!currentClinic || !newKey.trim() || !newValue.trim()) return;
    await fetch('/api/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clinicId: currentClinic.id,
        category: activeCategory,
        key:      newKey.trim(),
        value:    newValue.trim(),
        order:    filteredEntries.length,
      }),
    });
    setNewKey(''); setNewValue(''); setAdding(false);
    fetchEntries();
  }

  async function handleUpdate(id: string, key: string, value: string) {
    await fetch('/api/brand', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, key, value }),
    });
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, key, value } : e)));
  }

  async function handleDelete(id: string) {
    await fetch('/api/brand', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // ─── ガード ───────────────────────────────────────────
  if (!currentClinic) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        院を選択してください
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">ブランド辞書</h1>
            <p className="text-sm text-slate-500">{currentClinic.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'PROFILE' && (
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Download size={14} />
              JSONで保存
            </button>
          )}
          <button
            onClick={() => { fetchEntries(); fetchProfile(); }}
            disabled={loading || profLoading}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition"
          >
            <RefreshCw size={16} className={(loading || profLoading) ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* ─── 左カラム: タブ ─────────────────────────── */}
        <div className="space-y-1">
          {/* 基本プロフィール タブ */}
          <button
            onClick={() => { setActiveTab('PROFILE'); setAdding(false); }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition text-left',
              activeTab === 'PROFILE'
                ? cn('text-white', color.bg)
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <span>📋 基本プロフィール</span>
          </button>

          {/* ブランド設定グループ */}
          <p className="px-3 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            ブランド設定
          </p>
          {BRAND_CATEGORIES.map((cat) => {
            const count = entries.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setAdding(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition text-left',
                  activeTab === cat
                    ? cn('text-white', color.bg)
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <span>{BRAND_CATEGORY_LABELS[cat]}</span>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === cat
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500',
                )}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* 蓄積ナレッジグループ */}
          <p className="px-3 pt-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Brain size={11} />
            蓄積ナレッジ
          </p>
          {KNOWLEDGE_CATEGORIES.map((cat) => {
            const count = entries.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setAdding(false); }}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition text-left',
                  activeTab === cat
                    ? cn('text-white', color.bg)
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <span>{BRAND_CATEGORY_LABELS[cat]}</span>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  activeTab === cat
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500',
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── 右カラム: コンテンツ ───────────────────── */}
        <div>
          {/* ── 基本プロフィール ── */}
          {activeTab === 'PROFILE' && (
            <div>
              <div className="bg-slate-100 rounded-xl px-4 py-3 mb-5 text-sm text-slate-600">
                💡 院ごとの固定情報を登録します。全てのAI生成コンテンツに自動で反映されます。
              </div>

              {profLoading ? (
                <PageSkeleton />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
                  {PROFILE_FIELDS.map(({ key, label, hint, rows, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        {label}
                      </label>
                      <p className="text-xs text-slate-400 mb-2">{hint}</p>
                      {rows === 1 ? (
                        <input
                          value={profile[key] ?? ''}
                          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                      ) : (
                        <textarea
                          value={profile[key] ?? ''}
                          onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                          rows={rows}
                          placeholder={placeholder}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                        />
                      )}
                    </div>
                  ))}

                  {/* 保存ボタン */}
                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={handleSaveProfile}
                      disabled={profSaving}
                      className={cn(
                        'flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition',
                        profSaved
                          ? 'bg-green-600'
                          : profSaving
                          ? 'bg-slate-300 cursor-not-allowed'
                          : cn(color.bg, 'hover:opacity-90'),
                      )}
                    >
                      {profSaved ? (
                        <><Check size={16} />保存しました</>
                      ) : profSaving ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />保存中...</>
                      ) : (
                        <><Save size={16} />プロフィールを保存</>
                      )}
                    </button>
                    <button
                      onClick={handleExportJson}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      <Download size={15} />
                      JSONでエクスポート
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── BrandEntry CRUD ── */}
          {activeTab !== 'PROFILE' && (
            <div>
              {/* カテゴリ説明 */}
              <div className="bg-slate-100 rounded-xl px-4 py-3 mb-4 text-sm text-slate-600">
                💡 {CATEGORY_DESCRIPTION[activeCategory]}
              </div>

              {/* エントリ一覧 */}
              <div className="space-y-2 mb-4">
                {filteredEntries.length === 0 && !adding && (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-sm">まだ登録されていません</p>
                    <p className="text-xs mt-1">「＋ エントリを追加」ボタンで最初のエントリを作成しましょう</p>
                  </div>
                )}
                {filteredEntries.map((entry) => (
                  <DictionaryCard
                    key={entry.id}
                    entry={entry}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>

              {/* 追加フォーム */}
              {adding ? (
                <div className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-4 space-y-3">
                  <input
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder={CATEGORY_PLACEHOLDER[activeCategory]?.key ?? '項目名'}
                    className="w-full px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <textarea
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    rows={KNOWLEDGE_CATEGORIES.includes(activeCategory) ? 4 : 3}
                    placeholder={CATEGORY_PLACEHOLDER[activeCategory]?.value ?? '内容を入力...'}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={!newKey.trim() || !newValue.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => { setAdding(false); setNewKey(''); setNewValue(''); }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-sm font-medium transition',
                    color.text, 'border-current hover:bg-slate-50',
                  )}
                >
                  <Plus size={16} />
                  エントリを追加
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
