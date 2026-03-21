// SQLite対応: Prismaのenumをアプリ側の型として定義

// ─── ブランドカテゴリ ───────────────────────────────────
export type BrandCategory =
  | 'TONE' | 'TARGET' | 'SERVICE' | 'KEYWORD' | 'TAGLINE' | 'NG_WORD'
  | 'PATIENT_VOICE'    // 患者の声・口コミ実例
  | 'SUCCESS_CASE'     // 症状改善事例
  | 'CLINIC_MEMO';     // 院からのメモ・特記事項

export const BrandCategory = {
  TONE:          'TONE',
  TARGET:        'TARGET',
  SERVICE:       'SERVICE',
  KEYWORD:       'KEYWORD',
  TAGLINE:       'TAGLINE',
  NG_WORD:       'NG_WORD',
  PATIENT_VOICE: 'PATIENT_VOICE',
  SUCCESS_CASE:  'SUCCESS_CASE',
  CLINIC_MEMO:   'CLINIC_MEMO',
} as const;

// ─── コンテンツステータス ───────────────────────────────
export type ContentStatus = 'DRAFT' | 'APPROVED' | 'ARCHIVED';

export const ContentStatus = {
  DRAFT: 'DRAFT', APPROVED: 'APPROVED', ARCHIVED: 'ARCHIVED',
} as const;

// ─── コンテンツタイプ ───────────────────────────────────
export type ContentType =
  | 'FAQ' | 'INSTAGRAM_POST' | 'INSTAGRAM_STORY'
  | 'META_AD' | 'LP_SECTION' | 'IMAGE_PROMPT'
  | 'HP_CHECK' | 'COMPETITOR_MEMO' | 'MONTHLY_REVIEW' | 'SEMINAR_SCRIPT'
  | 'MULTI_CONTENT';

// ─── 院 ────────────────────────────────────────────────
export interface Clinic {
  id: string;
  name: string;
  slug: string;
  color: string;
}

// ─── 院ブランドプロフィール ────────────────────────────
export interface ClinicBrandProfile {
  id: string;
  clinicId: string;
  description: string;
  brandTone: string;
  primaryKeywords: string;    // 改行区切りテキスト
  areaKeywords: string;       // 改行区切りテキスト
  greeting: string;
  ctaText: string;
  recommendedPhrases: string; // 改行区切りテキスト
  forbiddenPhrases: string;   // 改行区切りテキスト
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClinicBrandProfileInput {
  description?: string;
  brandTone?: string;
  primaryKeywords?: string;
  areaKeywords?: string;
  greeting?: string;
  ctaText?: string;
  recommendedPhrases?: string;
  forbiddenPhrases?: string;
  notes?: string;
}

export interface BrandProfileExport {
  clinicName: string;
  exportedAt: string;
  profile: {
    description: string;
    brandTone: string;
    primaryKeywords: string[];
    areaKeywords: string[];
    greeting: string;
    ctaText: string;
    recommendedPhrases: string[];
    forbiddenPhrases: string[];
    notes: string;
  };
  brandEntries: Record<string, { key: string; value: string }[]>;
}

// ─── ブランド辞書 ───────────────────────────────────────
export interface BrandEntry {
  id: string;
  clinicId: string;
  category: BrandCategory;
  key: string;
  value: string;
  order: number;
  isActive: boolean;
  updatedAt: Date;
}

export interface BrandEntryInput {
  category: BrandCategory;
  key: string;
  value: string;
  order?: number;
  isActive?: boolean;
}

export const BRAND_CATEGORY_LABELS: Record<BrandCategory, string> = {
  TONE:          'トーン・文体',
  TARGET:        'ターゲット像',
  SERVICE:       '強み・サービス',
  KEYWORD:       '訴求キーワード',
  TAGLINE:       'タグライン・コピー',
  NG_WORD:       'NGワード',
  PATIENT_VOICE: '患者の声・口コミ',
  SUCCESS_CASE:  '改善事例',
  CLINIC_MEMO:   '院メモ・特記事項',
};

// ─── コンテンツテンプレート ─────────────────────────────
export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  placeholder: string;
  options?: string[];
}

export interface ContentTemplate {
  id: string;
  clinicId: string | null;
  type: ContentType;
  name: string;
  description: string;
  promptTemplate: string;
  variables: TemplateVariable[];
  isActive: boolean;
}

// ─── 生成済みコンテンツ ────────────────────────────────
export interface GeneratedContent {
  id: string;
  clinicId: string;
  templateId: string | null;
  type: string;            // ContentType または MediaType 文字列
  title: string;
  inputParams: Record<string, string>;
  output: string;
  status: ContentStatus;
  rating: string;          // "good" | "bad" | "none"
  tags: string[];
  note: string;
  createdAt: Date;
  updatedAt: Date;
}

// ContentStatus ラベル
export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT:    '下書き',
  APPROVED: '確認済み',
  ARCHIVED: 'アーカイブ',
};

// ContentType ラベル
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  FAQ:              'FAQ',
  INSTAGRAM_POST:   'Instagram投稿',
  INSTAGRAM_STORY:  'Instagramストーリーズ',
  META_AD:          'Meta広告',
  LP_SECTION:       'LPセクション',
  IMAGE_PROMPT:     '画像生成指示文',
  HP_CHECK:         'SNSチェック',
  COMPETITOR_MEMO:  '競合分析メモ',
  MONTHLY_REVIEW:   '月次振り返り',
  SEMINAR_SCRIPT:   '動画台本',
  MULTI_CONTENT:    'SNS一括生成',
};

// ─── AI生成 ────────────────────────────────────────────
export interface GenerateRequest {
  clinicId: string;
  templateId: string;
  inputs: Record<string, string>;
  title?: string;
}

export interface GenerateResponse {
  content: GeneratedContent;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

// ─── API共通レスポンス ─────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

// ─── 一括生成：媒体タイプ ───────────────────────────────
export const MEDIA_TYPES = [
  // SNS系
  'instagram', 'instagram_story', 'instagram_reel',
  'threads', 'youtube_short', 'youtube_script',
  // 広告系
  'meta_ad', 'meta_ad_video',
  // LINE系
  'line_message',
] as const;

export type MediaType = typeof MEDIA_TYPES[number];

export const MEDIA_LABELS: Record<MediaType, string> = {
  instagram:       'Instagram投稿',
  instagram_story: 'Instagramストーリーズ',
  instagram_reel:  'Instagramリール',
  threads:         'Threads投稿',
  youtube_short:   'YouTubeショート台本',
  youtube_script:  'YouTube動画台本',
  meta_ad:         'Meta広告文',
  meta_ad_video:   'Meta動画広告',
  line_message:    'LINEメッセージ',
};

// 短い媒体（半幅表示）
export const MEDIA_HALF_WIDTH: ReadonlySet<MediaType> = new Set<MediaType>([
  'threads', 'line_message',
]);

// 媒体グループ（UI 表示用）
export const MEDIA_GROUPS = [
  { label: 'Instagram', types: ['instagram', 'instagram_story', 'instagram_reel'] as MediaType[] },
  { label: 'YouTube', types: ['youtube_short', 'youtube_script'] as MediaType[] },
  { label: 'SNS', types: ['threads'] as MediaType[] },
  { label: '広告', types: ['meta_ad', 'meta_ad_video'] as MediaType[] },
  { label: 'LINE', types: ['line_message'] as MediaType[] },
] as const;

// ─── 一括生成：入力 ─────────────────────────────────────
export interface MultiGenInput {
  clinicId:         string;
  theme:            string;
  symptom:          string;
  target:           string;
  areaName:         string;   // 地域名（任意）
  faqCount:         number;   // FAQ数 1〜10
  mediaTypes:       MediaType[];
  charCount:        'short' | 'medium' | 'long';
  writingStyle:     'friendly' | 'formal' | 'casual';
  requiredKeywords: string;   // 改行/カンマ区切り
  avoidExpressions: string;   // 改行/カンマ区切り
}

// ─── 一括生成：出力 ─────────────────────────────────────
export interface OutputItem {
  mediaType:  MediaType;
  label:      string;
  content:    string;
  charCount:  number;
  warnings:   string[];
  contentId?: string;    // 保存後に付与される DB レコード ID
}

export interface MultiGenResult {
  contentId:  string;
  outputs:    OutputItem[];
  durationMs: number;
}

// ─── Instagramストーリーズ ──────────────────────────────
export type StoryPostType = 'story' | 'feed' | 'reel';
export type StoryMood     = 'warm' | 'cool' | 'pop' | 'calm';

export interface StoryGenInput {
  clinicId:    string;
  theme:       string;
  postType:    StoryPostType;
  target:      string;
  mood:        StoryMood;
  ctaStrength: 1 | 2 | 3;   // 1:柔らかめ 2:標準 3:強め
  slideCount:  number;       // story: 1〜7, feed/reel: 1
  imageNotes:  string;       // 画像イメージメモ（任意）
}

export interface StorySlide {
  page:             number;
  upperText:        string;      // 上段テキスト
  imageInstruction: string;      // 画像指示文
  lowerText:        string;      // 下段リード文
  titleCandidates:  string[];    // タイトル候補2〜3案
  ctaText:          string;
  hashtags:         string[];    // 最終スライドのみ 10〜15個
}

export interface StoryGenResult {
  contentId: string;
  slides:    StorySlide[];
}

export const STORY_POST_TYPE_LABELS: Record<StoryPostType, string> = {
  story: 'ストーリーズ',
  feed:  'フィード投稿',
  reel:  'リール',
};

export const STORY_MOOD_LABELS: Record<StoryMood, string> = {
  warm: 'あたたかみ',
  cool: 'クール・清潔感',
  pop:  'ポップ・明るい',
  calm: 'おだやか・ていねい',
};

// ─── Meta広告・LP素材（訴求軸別） ──────────────────────
export type AppealAxis =
  | 'pain' | 'numbness' | 'anxiety' | 'nerve' | 'last_resort';

export type AdType = 'image_ad' | 'video_ad' | 'lp';

export interface CampaignInput {
  clinicId:     string;
  symptom:      string;
  target:       string;
  appealAxes:   AppealAxis[];   // 複数選択
  adTypes:      AdType[];       // 複数選択
  writingStyle: 'friendly' | 'formal' | 'casual';
  ctaStrength:  1 | 2 | 3;
}

export interface CampaignOutput {
  appealAxis:    AppealAxis;
  appealLabel:   string;
  mainText:      string;
  headline:      string;
  description:   string;
  videoOutline?: string;   // adType に video_ad が含まれる場合
  lpHero?:       string;   // adType に lp が含まれる場合
  lpSubcopy?:    string;
  ctaOptions:    string[]; // 3案
}

export interface CampaignResult {
  contentId: string;
  outputs:   CampaignOutput[];
  durationMs:number;
}

export const APPEAL_LABELS: Record<AppealAxis, string> = {
  pain:        '痛み訴求',
  numbness:    'しびれ訴求',
  anxiety:     '不安訴求',
  nerve:       '神経訴求',
  last_resort: '最後の選択肢',
};

export const AD_TYPE_LABELS: Record<AdType, string> = {
  image_ad:  '画像広告',
  video_ad:  '動画広告',
  lp:        'LPコピー',
};

// ─── 画像指示文生成 ─────────────────────────────────────
export type ImageUseCase  = 'instagram' | 'youtube' | 'threads' | 'ad';
export type ImageStyle    = 'illustration' | 'photo';
export type AspectRatio   = '16:9' | '1:1' | '4:5' | '9:16';

export interface ImagePromptInput {
  clinicId:    string;
  useCase:     ImageUseCase;
  theme:       string;
  symptom:     string;
  mood:        string;        // 例: あたたかみ、清潔感、プロフェッショナル
  background:  string;        // 例: 白背景、院内、屋外
  hasHuman:    boolean;
  style:       ImageStyle;
  aspectRatio: AspectRatio;
}

export interface ImagePromptOutput {
  mainPrompt:       string;   // AI画像生成AIへの主要指示文
  ngElements:       string;   // NG要素
  noTextNote:       string;   // テキストなし推奨文
  compositionGuide: string;   // 構図指示
  colorDirection:   string;   // 色味方向
  variations:       string[]; // バリエーション2〜3案
}

export interface ImagePromptResult {
  contentId: string;
  output:    ImagePromptOutput;
  durationMs:number;
}

export const IMAGE_USE_CASE_LABELS: Record<ImageUseCase, string> = {
  instagram: 'Instagram',
  youtube:   'YouTube',
  threads:   'Threads',
  ad:        '広告バナー',
};

export const IMAGE_STYLE_LABELS: Record<ImageStyle, string> = {
  illustration: 'イラスト',
  photo:        'フォト風',
};

export const ASPECT_RATIO_LABELS: Record<AspectRatio, string> = {
  '16:9': '横長 16:9',
  '1:1':  '正方形 1:1',
  '4:5':  '縦型 4:5',
  '9:16': 'ストーリーズ 9:16',
};

// ─── 競合分析 ───────────────────────────────────────────
export type CompareType = 'seo' | 'meo' | 'lp' | 'instagram' | 'appeal';

export interface CompetitorInput {
  clinicId:       string;
  competitorName: string;
  url:            string;       // 任意（参考表示のみ）
  pageText:       string;       // 貼り付けテキスト（必須）
  compareTypes:   CompareType[];
}

export interface CompetitorAnalysis {
  strengths:       string[];   // 競合の強み
  weaknesses:      string[];   // 競合の弱み・改善余地
  appealFeatures:  string;     // 訴求の特徴まとめ
  estimatedTarget: string;     // 推定ターゲット像
  winningPoints:   string[];   // 自院が勝てるポイント
  missingContent:  string[];   // 競合にない・足りないコンテンツ
  nextActions:     string[];   // 次のアクション提案
}

export interface CompetitorResult {
  contentId: string;
  analysis:  CompetitorAnalysis;
  durationMs:number;
}

export const COMPARE_TYPE_LABELS: Record<CompareType, string> = {
  seo:       'SEO・コンテンツ',
  meo:       'MEO・口コミ',
  lp:        'LP・訴求',
  instagram: 'Instagram',
  appeal:    '訴求軸・差別化',
};

// ─── コンテンツ管理マップ ────────────────────────────────
export type MapContentType = 'instagram' | 'youtube' | 'threads' | 'line' | 'meta_ad';
export type MapStatus      = 'planned' | 'creating' | 'published';

export const MAP_CONTENT_TYPE_LABELS: Record<MapContentType, string> = {
  instagram: 'Instagram',
  youtube:   'YouTube',
  threads:   'Threads',
  line:      'LINE',
  meta_ad:   'Meta広告',
};

export const MAP_STATUS_LABELS: Record<MapStatus, string> = {
  planned:   '企画中',
  creating:  '制作中',
  published: '公開済',
};

export const MAP_STATUS_COLORS: Record<MapStatus, string> = {
  planned:   'bg-slate-100 text-slate-600',
  creating:  'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
};

export const MAP_CONTENT_TYPES: MapContentType[] = ['instagram', 'youtube', 'threads', 'line', 'meta_ad'];

export interface ContentMapItem {
  id:          string;
  clinicId:    string;
  title:       string;
  contentType: MapContentType;
  symptom:     string;
  theme:       string;
  target:      string;
  urlOrMemo:   string;
  status:      MapStatus;
  tags:        string[];  // parsed from JSON
  note:        string;
  createdAt:   string;
  updatedAt:   string;
}

export interface ContentMapInput {
  clinicId:    string;
  title:       string;
  contentType: MapContentType;
  symptom:     string;
  theme:       string;
  target:      string;
  urlOrMemo:   string;
  status:      MapStatus;
  tags:        string[];
  note:        string;
}

// ─── チラシ管理 ─────────────────────────────────────────
export type FlyerType = 'A4' | 'A5' | 'DM' | 'web' | 'leaflet';

export const FLYER_TYPE_LABELS: Record<FlyerType, string> = {
  A4:      'A4チラシ',
  A5:      'A5チラシ',
  DM:      'DM（はがき）',
  web:     'Webバナー',
  leaflet: 'リーフレット',
};

export const FLYER_TYPES: FlyerType[] = ['A4', 'A5', 'DM', 'web', 'leaflet'];

export interface Flyer {
  id:          string;
  clinicId:    string;
  title:       string;
  flyerType:   FlyerType;
  catchCopy:   string;
  bodyText:    string;
  backText:    string;
  ctaText:     string;
  targetText:  string;
  designNotes: string;
  fileUrl:     string;
  status:      string;   // DRAFT | APPROVED | ARCHIVED
  tags:        string[]; // parsed from JSON
  createdAt:   string;
  updatedAt:   string;
}

export interface FlyerInput {
  clinicId:    string;
  title:       string;
  flyerType:   FlyerType;
  catchCopy?:  string;
  bodyText?:   string;
  backText?:   string;
  ctaText?:    string;
  targetText?: string;
  designNotes?:string;
  fileUrl?:    string;
  status?:     string;
  tags?:       string[];
}

export interface FlyerGenInput {
  clinicId:  string;
  theme:     string;
  flyerType: FlyerType;
  target:    string;
  campaign:  string;  // キャンペーン内容・特典（任意）
  tone:      'friendly' | 'formal' | 'casual';
}

export interface FlyerCopy {
  catchCopy:   string;
  bodyText:    string;
  backText:    string;
  ctaText:     string;
  designNotes: string;
}

// ─── LINE テンプレート ──────────────────────────────────
export type LineCategory =
  | 'greeting'
  | 'reminder'
  | 'follow_up'
  | 'reactivation'
  | 'promotion'
  | 'custom';

export const LINE_CATEGORY_LABELS: Record<LineCategory, string> = {
  greeting:     'はじめまして・初回対応',
  reminder:     '来院リマインド',
  follow_up:    '施術後フォロー',
  reactivation: '休眠顧客・再来院促進',
  promotion:    'キャンペーン・お知らせ',
  custom:       'カスタム',
};

export const LINE_CATEGORIES: LineCategory[] = [
  'greeting', 'reminder', 'follow_up', 'reactivation', 'promotion', 'custom',
];

export interface LineQuickReply {
  label: string;
  text:  string;
}

export interface LineTemplate {
  id:          string;
  clinicId:    string;
  title:       string;
  category:    LineCategory;
  message:     string;
  quickReplies:LineQuickReply[]; // parsed from JSON
  isActive:    boolean;
  tags:        string[];         // parsed from JSON
  createdAt:   string;
  updatedAt:   string;
}

export interface LineTemplateInput {
  clinicId:     string;
  title:        string;
  category:     LineCategory;
  message:      string;
  quickReplies?: LineQuickReply[];
  isActive?:    boolean;
  tags?:        string[];
}

export interface LineTemplateGenInput {
  clinicId: string;
  category: LineCategory;
  context:  string;  // 例: 初回予約後の自動返信
  tone:     'friendly' | 'formal' | 'casual';
}

// ─── ステップ LINE シナリオ ────────────────────────────
export type ScenarioType = 'pre_visit' | 'post_visit' | 'dormant' | 'custom';

export const SCENARIO_TYPE_LABELS: Record<ScenarioType, string> = {
  pre_visit:  '来院前',
  post_visit: '来院後',
  dormant:    '休眠顧客',
  custom:     '汎用',
};

export const SCENARIO_TYPE_COLORS: Record<ScenarioType, string> = {
  pre_visit:  'bg-blue-100 text-blue-700',
  post_visit: 'bg-emerald-100 text-emerald-700',
  dormant:    'bg-amber-100 text-amber-700',
  custom:     'bg-slate-100 text-slate-600',
};

export const SCENARIO_TYPES: ScenarioType[] = ['pre_visit', 'post_visit', 'dormant', 'custom'];

export interface LineStep {
  id:         string;
  scenarioId: string;
  stepNumber: number;
  title:      string;
  message:    string;
  delayDays:  number;
  delayHours: number;
  condition:  string;
  createdAt:  string;
  updatedAt:  string;
}

export interface LineScenario {
  id:           string;
  clinicId:     string;
  title:        string;
  scenarioType: ScenarioType;
  description:  string;
  triggerMemo:  string;
  isActive:     boolean;
  steps:        LineStep[];
  createdAt:    string;
  updatedAt:    string;
}

export interface LineScenarioInput {
  clinicId:     string;
  title:        string;
  scenarioType: ScenarioType;
  description?: string;
  triggerMemo?: string;
  isActive?:    boolean;
}

export interface LineStepInput {
  scenarioId:  string;
  stepNumber:  number;
  title:       string;
  message:     string;
  delayDays?:  number;
  delayHours?: number;
  condition?:  string;
}

export interface ScenarioGenInput {
  clinicId:     string;
  scenarioType: ScenarioType;
  theme:        string;
  target:       string;
  stepCount:    number;   // 3〜7
  tone:         'friendly' | 'formal' | 'casual';
}

export interface GeneratedStep {
  stepNumber: number;
  title:      string;
  message:    string;
  delayDays:  number;
  delayHours: number;
  condition:  string;
}

// ─── Phase 10: 患者の声 → コンテンツ生成 ──────────────────
export const PATIENT_VOICE_MEDIA_TYPES = [
  'pv_instagram',
  'pv_instagram_story',
  'pv_youtube_short',
  'pv_meta_ad',
  'pv_line_message',
  'pv_threads',
] as const;

export type PatientVoiceMediaType = typeof PATIENT_VOICE_MEDIA_TYPES[number];

export const PATIENT_VOICE_MEDIA_LABELS: Record<PatientVoiceMediaType, string> = {
  pv_instagram:       'Instagram投稿',
  pv_instagram_story: 'Instagramストーリーズ',
  pv_youtube_short:   'YouTubeショート台本',
  pv_meta_ad:         'Meta広告文',
  pv_line_message:    'LINEフォローメッセージ',
  pv_threads:         'Threads投稿',
};

export const PATIENT_VOICE_MEDIA_HALF_WIDTH: ReadonlySet<PatientVoiceMediaType> = new Set<PatientVoiceMediaType>([
  'pv_line_message',
  'pv_threads',
]);

export interface PatientVoiceInput {
  clinicId:     string;
  voiceText:    string;
  symptom:      string;
  target:       string;
  mediaTypes:   PatientVoiceMediaType[];
  writingStyle: 'friendly' | 'formal' | 'casual';
}

export interface PatientVoiceOutputItem {
  mediaType:  PatientVoiceMediaType;
  label:      string;
  content:    string;
  charCount:  number;
  warnings:   string[];
  contentId?: string;
}

export interface PatientVoiceResult {
  contentId:  string;
  outputs:    PatientVoiceOutputItem[];
  durationMs: number;
}

// ─── Phase 11: 動画広告クリエイティブ生成 ─────────────────
export type VideoAdLength = '15s' | '30s' | '60s';

export const VIDEO_AD_LENGTH_LABELS: Record<VideoAdLength, string> = {
  '15s': '15秒（バンパー広告）',
  '30s': '30秒（標準）',
  '60s': '60秒（詳細訴求）',
};

export const VIDEO_AD_LENGTHS: VideoAdLength[] = ['15s', '30s', '60s'];

export interface VideoAdInput {
  clinicId:    string;
  symptom:     string;
  target:      string;
  appealAxis:  string;
  adLengths:   VideoAdLength[];
  tone:        'friendly' | 'formal' | 'casual';
  ctaStrength: 1 | 2 | 3;
}

export interface VideoAdScene {
  timeCode: string;   // 例: "0:00〜0:03"
  caption:  string;   // テロップ文
  visual:   string;   // 映像指示
}

export interface VideoAdScript {
  length:    VideoAdLength;
  label:     string;
  opening:   string;
  narration: string;
  scenes:    VideoAdScene[];
  closing:   string;
  cta:       string;
}

export interface VideoAdResult {
  contentId:  string;
  scripts:    VideoAdScript[];
  durationMs: number;
}

// ─── Phase 12: 口コミ収集QRコード機能 ────────────────────
export interface ReviewPageConfig {
  clinicId:      string;
  googleUrl:     string;   // Googleマップの口コミURL
  hotpepperUrl?: string;   // ホットペッパーの口コミURL（任意）
  positiveThreshold: number;  // 満足度スコアの閾値（1〜5）
  guidanceText:  string;   // 案内文（AI生成）
}

export interface ReviewPageResult {
  contentId:   string;
  reviewUrl:   string;   // /review/[clinicSlug] のURL
  qrImageUrl:  string;   // QR画像URL
  guidanceText:string;
}

// ─── Phase 13: 音声録音・文字起こし ─────────────────────
export interface TranscribeResult {
  text:         string;
  durationMs:   number;
}

// ─── Note（記事）生成 ───────────────────────────────────
export type NoteType = 'story' | 'knowledge' | 'column';

export const NOTE_TYPES: NoteType[] = ['story', 'knowledge', 'column'];

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  story:     'ストーリー',
  knowledge: 'お役立ち解説',
  column:    '院長コラム',
};

export interface NoteGenInput {
  clinicId:     string;
  theme:        string;
  noteType:     NoteType;
  target:       string;
  writingStyle: 'friendly' | 'formal' | 'casual';
  charTarget:   number;
  cta?:         string;
}

export interface NoteGenResult {
  contentId:    string;
  titles:       string[];
  body:         string;
  hashtags:     string[];
  seoMemo?:     string;
  charCount:    number;
  durationMs:   number;
}

// ─── 予約投稿ステータス ─────────────────────────────────
export type ScheduledPostStatus = 'PENDING' | 'PUBLISHED' | 'FAILED' | 'CANCELLED';

export const SCHEDULED_POST_STATUS_LABELS: Record<ScheduledPostStatus, string> = {
  PENDING:   '予約中',
  PUBLISHED: '投稿済み',
  FAILED:    '失敗',
  CANCELLED: 'キャンセル',
};

export const SCHEDULED_POST_STATUS_COLORS: Record<ScheduledPostStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  FAILED:    'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
};

export interface ScheduledPost {
  id:           string;
  contentId:    string;
  clinicId:     string;
  platform:     string;
  content:      string;
  scheduledAt:  string;
  status:       ScheduledPostStatus;
  publishedAt:  string | null;
  errorMessage: string | null;
  createdAt:    string;
  updatedAt:    string;
}

// ─── Phase 14: 患者別カスタマイズLINE ────────────────────
export interface Patient {
  id:          string;
  clinicId:    string;
  name:        string;
  kana?:       string;
  phone?:      string;
  symptom:     string;
  memo:        string;
  visitCount:  number;
  lastVisitAt: string | null;
  createdAt:   string;
  updatedAt:   string;
}

export interface PatientVisit {
  id:          string;
  patientId:   string;
  visitedAt:   string;
  sessionNote: string;
  nextAction:  string;
  createdAt:   string;
}

export interface PatientInput {
  clinicId:  string;
  name:      string;
  kana?:     string;
  phone?:    string;
  symptom:   string;
  memo?:     string;
}

export interface PatientVisitInput {
  patientId:   string;
  visitedAt?:  string;
  sessionNote: string;
  nextAction?: string;
}

export interface PersonalLineGenInput {
  clinicId:    string;
  patientId:   string;
  sessionNote: string;
  lineType:    'follow_up' | 'reminder' | 'reactivation';
  tone:        'friendly' | 'formal' | 'casual';
}
