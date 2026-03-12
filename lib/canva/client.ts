// Canva Connect API クライアント
// 参考: https://www.canva.dev/docs/connect/

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

export type CanvaDesignPreset =
  | 'instagram_post'
  | 'your_story'
  | 'facebook_post'
  | 'flyer'
  | 'poster'
  | 'presentation'
  | 'youtube_thumbnail'
  | 'twitter_post';

// ClinicMark の媒体タイプ → Canva デザインタイプ マッピング
export const MEDIA_TO_CANVA: Record<string, CanvaDesignPreset> = {
  // 一括生成
  instagram:   'instagram_post',
  gmb:         'poster',
  meta_ad:     'facebook_post',
  lp_hero:     'poster',
  // 専用ページ
  INSTAGRAM_POST:  'instagram_post',
  INSTAGRAM_STORY: 'your_story',
  META_AD:         'facebook_post',
  FLYER:           'flyer',
  GMB:             'poster',
  VIDEO_AD:        'youtube_thumbnail',
  PATIENT_VOICE:   'poster',
};

// Canvaのデザイン作成URL（API未設定時のフォールバック）
export const CANVA_CREATE_URLS: Record<CanvaDesignPreset, string> = {
  instagram_post:   'https://www.canva.com/design?create&type=instagram-post',
  your_story:       'https://www.canva.com/design?create&type=instagram-story',
  facebook_post:    'https://www.canva.com/design?create&type=facebook-post',
  flyer:            'https://www.canva.com/design?create&type=flyer',
  poster:           'https://www.canva.com/design?create&type=poster',
  presentation:     'https://www.canva.com/design?create&type=presentation',
  youtube_thumbnail:'https://www.canva.com/design?create&type=youtube-thumbnail',
  twitter_post:     'https://www.canva.com/design?create&type=twitter-post',
};

export interface CanvaDesignResult {
  editUrl: string;
  viewUrl?: string;
  designId?: string;
}

// Canva Connect API でデザインを作成して編集URLを返す
export async function createCanvaDesign(
  designType: CanvaDesignPreset,
  title: string,
): Promise<CanvaDesignResult> {
  const token = process.env.CANVA_API_TOKEN;
  if (!token) {
    throw new Error('CANVA_API_TOKEN が設定されていません');
  }

  const res = await fetch(`${CANVA_API_BASE}/designs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      design_type: { type: 'preset', name: designType },
      title,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Canva API エラー ${res.status}: ${err}`);
  }

  const data = await res.json();
  const design = data.design;

  return {
    editUrl:  design.urls?.edit_url ?? '',
    viewUrl:  design.urls?.view_url,
    designId: design.id,
  };
}

export function isCanvaEnabled(): boolean {
  return !!process.env.CANVA_API_TOKEN;
}
