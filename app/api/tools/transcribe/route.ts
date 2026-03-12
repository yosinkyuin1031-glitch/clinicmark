import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IS_MOCK_MODE } from '@/lib/ai/client';

// モック文字起こし結果
const MOCK_TRANSCRIPTION = `毎朝起きると首と肩がパンパンで、仕事中も頭痛が続いてしまって本当につらいんですよね。デスクワークが多くて一日中パソコンの前に座っているので、それが原因かなとは思っているんですけど。夜はしっかり寝ているのに、翌朝にはまた同じ状態で、もう諦めていました。整体は初めてなんですが、こんなに長く続いている症状でも施術してもらえますか？`;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const startTime = Date.now();

  if (IS_MOCK_MODE) {
    // モードモックでは即座に返す
    await new Promise(r => setTimeout(r, 1200));
    return NextResponse.json({
      data: { text: MOCK_TRANSCRIPTION, durationMs: Date.now() - startTime },
    });
  }

  // 本番: OpenAI Whisper API を使う
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File | null;
    if (!file) return NextResponse.json({ error: '音声ファイルが見つかりません' }, { status: 400 });

    // Whisper API へ転送
    const whisperForm = new FormData();
    whisperForm.append('file', file, file.name || 'audio.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', 'ja');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method:  'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body:    whisperForm,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      console.error('Whisper error:', err);
      return NextResponse.json({ error: '文字起こしに失敗しました' }, { status: 500 });
    }

    const result = await whisperRes.json();
    return NextResponse.json({
      data: { text: result.text, durationMs: Date.now() - startTime },
    });
  } catch (e) {
    console.error('Transcribe error:', e);
    return NextResponse.json({ error: '文字起こし処理でエラーが発生しました' }, { status: 500 });
  }
}
