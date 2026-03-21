import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/threads/connect?clinicId=xxx
// Threads OAuth の認可 URL にリダイレクト
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clinicId = searchParams.get('clinicId');
  if (!clinicId) return NextResponse.json({ error: 'clinicId が必要です' }, { status: 400 });

  const appId       = process.env.THREADS_APP_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/threads/callback`;

  if (!appId) {
    return NextResponse.json(
      { error: 'THREADS_APP_ID が .env に設定されていません' },
      { status: 500 },
    );
  }

  // state に clinicId を乗せてCSRF対策
  const state = Buffer.from(JSON.stringify({ clinicId })).toString('base64');

  const authUrl = new URL('https://threads.net/oauth/authorize');
  authUrl.searchParams.set('client_id',     appId);
  authUrl.searchParams.set('redirect_uri',  redirectUri);
  authUrl.searchParams.set('scope',         'threads_basic,threads_content_publish');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state',         state);

  return NextResponse.redirect(authUrl.toString());
}
