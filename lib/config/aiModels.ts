import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';

export interface ImageModelConfig {
  value:        string;
  label:        string;
  badge:        string;
  desc:         string;
  envKey:       string;
  apiModel:     string;
  available:    boolean;
  supportsEdit: boolean;
}

export interface TextModelConfig {
  value:     string;
  label:     string;
  badge:     string;
  desc:      string;
  envKey:    string;
  apiModel:  string;
  available: boolean;
}

interface AiModelConfig {
  _meta: { lastChecked: string; note: string };
  imageModels: ImageModelConfig[];
  textModels:  TextModelConfig[];
}

const CONFIG_PATH = path.join(process.cwd(), 'config', 'ai-models.json');

// ─── 設定ファイルを読み込む ───────────────────────────────
export function loadAiModels(): AiModelConfig {
  if (!existsSync(CONFIG_PATH)) {
    return getDefaultConfig();
  }
  try {
    const raw = readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw) as AiModelConfig;
  } catch {
    return getDefaultConfig();
  }
}

// ─── 設定ファイルを保存する ──────────────────────────────
export function saveAiModels(config: AiModelConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ─── 画像モデル一覧を取得（API KEY が設定されているもののみ） ─
export function getAvailableImageModels(): ImageModelConfig[] {
  const config = loadAiModels();
  return config.imageModels.filter(m => m.available);
}

// ─── Gemini 利用可能モデルを API から取得 ────────────────
export async function fetchGeminiImageModels(): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    // 画像生成に対応しているモデルだけ抽出
    return (data.models ?? [])
      .filter((m: { name: string; supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes('generateContent') &&
        (m.name.includes('image') || m.name.includes('imagen')),
      )
      .map((m: { name: string }) => m.name.replace('models/', ''));
  } catch {
    return [];
  }
}

// ─── OpenAI 利用可能画像モデルを API から取得 ────────────
export async function fetchOpenAIImageModels(): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? [])
      .map((m: { id: string }) => m.id)
      .filter((id: string) =>
        id.includes('gpt-image') || id.includes('dall-e'),
      );
  } catch {
    return [];
  }
}

// ─── 設定を最新状態に更新する（週次タスクから呼ばれる） ──
export async function refreshAiModels(): Promise<{
  updated: boolean;
  changes: string[];
}> {
  const config    = loadAiModels();
  const changes: string[] = [];

  // Gemini モデルチェック
  const geminiModels = await fetchGeminiImageModels();
  if (geminiModels.length > 0) {
    // 最新の画像生成モデルを特定（image-generation を優先）
    const best =
      geminiModels.find(m => m.includes('flash-preview-image')) ??
      geminiModels.find(m => m.includes('imagen'))              ??
      geminiModels[0];

    const current = config.imageModels.find(m => m.value === 'gemini');
    if (current && current.apiModel !== best) {
      changes.push(`Gemini: ${current.apiModel} → ${best}`);
      current.apiModel = best;
      current.badge    = best.split('-').slice(0, 3).join('-');
    }
    if (current) current.available = true;
  }

  // OpenAI モデルチェック
  const openaiModels = await fetchOpenAIImageModels();
  if (openaiModels.length > 0) {
    // 最新の gpt-image モデルを優先
    const best =
      openaiModels.sort().reverse().find(m => m.startsWith('gpt-image')) ??
      openaiModels[0];

    const current = config.imageModels.find(m => m.value === 'openai');
    if (current && current.apiModel !== best) {
      changes.push(`OpenAI: ${current.apiModel} → ${best}`);
      current.apiModel = best;
      current.badge    = best;
    }
    if (current) current.available = true;
  }

  config._meta.lastChecked = new Date().toISOString();

  if (changes.length > 0) {
    saveAiModels(config);
    return { updated: true, changes };
  }

  // 変更なくても lastChecked は更新
  saveAiModels(config);
  return { updated: false, changes: [] };
}

// ─── デフォルト設定（ファイル未存在時） ──────────────────
function getDefaultConfig(): AiModelConfig {
  return {
    _meta: {
      lastChecked: new Date().toISOString(),
      note: 'このファイルはスケジュールタスクにより自動更新されます',
    },
    imageModels: [
      {
        value:        'openai',
        label:        'OpenAI',
        badge:        'gpt-image-1',
        desc:         '高品質・安定した画像生成',
        envKey:       'OPENAI_API_KEY',
        apiModel:     'gpt-image-1',
        available:    true,
        supportsEdit: true,
      },
      {
        value:        'gemini',
        label:        'Nano Banana Pro',
        badge:        'Gemini',
        desc:         '日本語テキスト描画が得意・最新Geminiモデル',
        envKey:       'GEMINI_API_KEY',
        apiModel:     'gemini-2.0-flash-preview-image-generation',
        available:    true,
        supportsEdit: true,
      },
    ],
    textModels: [
      {
        value:     'claude',
        label:     'Claude',
        badge:     'claude-3-5-sonnet-20241022',
        desc:      '日本語コンテンツ生成メイン',
        envKey:    'ANTHROPIC_API_KEY',
        apiModel:  'claude-3-5-sonnet-20241022',
        available: true,
      },
    ],
  };
}
