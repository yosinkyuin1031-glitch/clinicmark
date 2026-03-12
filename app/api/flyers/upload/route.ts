import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import path from 'path';

// ─── POST: ファイルアップロード ────────────────────────
// multipart/form-data で受け取り /public/uploads/flyers/ に保存
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
    }

    // ファイル名をユニークに
    const ext      = path.extname(file.name) || '.pdf';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const savePath = path.join(process.cwd(), 'public', 'uploads', 'flyers', filename);

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(savePath, Buffer.from(arrayBuffer));

    const fileUrl = `/uploads/flyers/${filename}`;
    return NextResponse.json({ fileUrl });
  } catch (err) {
    console.error('[flyer upload]', err);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
