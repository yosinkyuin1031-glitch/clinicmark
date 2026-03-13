import { NextRequest, NextResponse } from 'next/server';

// POST /api/tools/image-remix/generate
// multipart/form-data:
//   image?        : File   (元画像 – あれば編集モード、なければ新規生成)
//   instructions  : string (変更内容・生成指示)
//   size?         : '1024x1024' | '1792x1024' | '1024x1792'
//   model?        : 'openai' | 'gemini'  (デフォルト: openai)
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'フォームデータの解析に失敗しました' }, { status: 400 });
  }

  const imageFile    = formData.get('image') as File | null;
  const instructions = (formData.get('instructions') as string | null)?.trim();
  const size         = (formData.get('size') as string | null) ?? '1024x1024';
  const model        = (formData.get('model') as string | null) ?? 'openai';

  if (!instructions) {
    return NextResponse.json({ error: '変更指示または生成内容を入力してください' }, { status: 400 });
  }

  const prompt = buildClinicPrompt(instructions, !!imageFile);

  // ════════════════════════════════════════════════
  //  Gemini モード
  // ════════════════════════════════════════════════
  if (model === 'gemini') {
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({
        imageUrl:    null,
        imageBase64: null,
        mode:        'mock',
        model:       'gemini',
        prompt,
        message:     'GEMINI_API_KEY が未設定のためモックモードで動作しています。.env に GEMINI_API_KEY を追加すると Gemini で実際に画像が生成されます。',
      });
    }

    try {
      const { aspectRatio, imageSize } = sizeToGemini(size);

      const parts: object[] = [];
      if (imageFile) {
        const arrayBuf = await imageFile.arrayBuffer();
        const base64   = Buffer.from(arrayBuf).toString('base64');
        parts.push({
          inlineData: {
            mimeType: imageFile.type || 'image/png',
            data:     base64,
          },
        });
      }
      parts.push({ text: prompt });

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              responseModalities: ['IMAGE', 'TEXT'],
              ...(aspectRatio !== '1:1' ? { imageConfig: { aspectRatio, imageSize } }
                                       : { imageConfig: { imageSize } }),
            },
          }),
        },
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini API ${geminiRes.status}: ${errText}`);
      }

      const data = await geminiRes.json();

      const imagePart = data.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.mimeType?.startsWith('image/'),
      );

      if (!imagePart?.inlineData?.data) {
        throw new Error('Gemini から画像データを受け取れませんでした');
      }

      return NextResponse.json({
        imageUrl:    null,
        imageBase64: imagePart.inlineData.data,
        imageMime:   imagePart.inlineData.mimeType ?? 'image/png',
        mode:        imageFile ? 'edit' : 'generate',
        model:       'gemini',
        prompt,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Gemini での画像生成に失敗しました' },
        { status: 500 },
      );
    }
  }

  // ════════════════════════════════════════════════
  //  OpenAI モード (デフォルト)
  // ════════════════════════════════════════════════
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return NextResponse.json({
      imageUrl:    null,
      imageBase64: null,
      mode:        'mock',
      model:       'openai',
      prompt,
      message:     'OPENAI_API_KEY が未設定のためモックモードで動作しています。.env に OPENAI_API_KEY を追加すると実際に画像が生成されます。',
    });
  }

  // ─── 画像編集モード (元画像あり) ──────────────────────
  if (imageFile) {
    try {
      const body = new FormData();
      body.append('model',  'gpt-image-1');
      body.append('prompt', prompt);
      body.append('image[]', imageFile);
      body.append('n',    '1');
      body.append('size', size);

      const res = await fetch('https://api.openai.com/v1/images/edits', {
        method:  'POST',
        headers: { Authorization: `Bearer ${openaiKey}` },
        body,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API ${res.status}: ${errText}`);
      }

      const data      = await res.json();
      const imageData = data.data?.[0];

      return NextResponse.json({
        imageUrl:    imageData?.url    ?? null,
        imageBase64: imageData?.b64_json ?? null,
        mode:        'edit',
        model:       'openai',
        prompt,
      });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : '画像編集に失敗しました' },
        { status: 500 },
      );
    }
  }

  // ─── 新規生成モード (元画像なし) ──────────────────────
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method:  'POST',
      headers: {
        Authorization:  `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model:  'gpt-image-1',
        prompt,
        n:      1,
        size,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API ${res.status}: ${errText}`);
    }

    const data      = await res.json();
    const imageData = data.data?.[0];

    return NextResponse.json({
      imageUrl:    imageData?.url    ?? null,
      imageBase64: imageData?.b64_json ?? null,
      mode:        'generate',
      model:       'openai',
      prompt,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '画像生成に失敗しました' },
      { status: 500 },
    );
  }
}

// ─── 治療院向けプロンプトを構築 ──────────────────────────────
function buildClinicPrompt(instructions: string, isEdit: boolean): string {
  const prefix = isEdit
    ? `日本の治療院・整骨院・鍼灸院のマーケティング画像を以下の指示に従って編集してください。`
    : `日本の治療院・整骨院・鍼灸院向けのマーケティング画像を生成してください。清潔感があり信頼性を感じるデザインで、`;
  return `${prefix}${instructions}。医療広告ガイドラインに準拠し、誇大表現は使わないこと。`;
}

// ─── OpenAI サイズ → Gemini imageConfig にマッピング ─────────
function sizeToGemini(size: string): { aspectRatio: string; imageSize: string } {
  switch (size) {
    case '1792x1024': return { aspectRatio: '16:9', imageSize: '1K' };
    case '1024x1792': return { aspectRatio: '9:16', imageSize: '1K' };
    default:          return { aspectRatio: '1:1',  imageSize: '1K' };
  }
}
