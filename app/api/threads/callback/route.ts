import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/threads/callback?code=xxx&state=xxx
// Threads から戻ってくる OAuth コールバック
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  // ユーザーが拒否した場合
  if (error) {
    return NextResponse.redirect(`${appUrl}/settings?threads=error&reason=${error}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/settings?threads=error&reason=missing_params`);
  }

  // state から clinicId を復元
  let clinicId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
    clinicId = decoded.clinicId;
  } catch {
    return NextResponse.redirect(`${appUrl}/settings?threads=error&reason=invalid_state`);
  }

  const appId       = process.env.THREADS_APP_ID!;
  const appSecret   = process.env.THREADS_APP_SECRET!;
  const redirectUri = `${appUrl}/api/threads/callback`;

  try {
    // ── Step 1: short-lived token を取得 ──────────────────
    const tokenRes = await fetch('https://graph.threads.net/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     appId,
        client_secret: appSecret,
        grant_type:    'authorization_code',
        redirect_uri:  redirectUri,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Threads token error:', tokenData);
      return NextResponse.redirect(`${appUrl}/settings?threads=error&reason=token_exchange`);
    }

    const shortToken = tokenData.access_token as string;
    const userId     = tokenData.user_id     as string;

    // ── Step 2: long-lived token に交換（60日有効） ────────
    const longRes = await fetch(
      `https://graph.threads.net/access_token?grant_type=th_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`,
    );
    const longData = await longRes.json();
    const accessToken = longData.access_token ?? shortToken;
    const expiresIn   = (longData.expires_in as number) ?? 5184000; // デフォルト60日

    // ── Step 3: ユーザー名を取得 ──────────────────────────
    const meRes  = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${accessToken}`,
    );
    const meData = await meRes.json();
    const username = (meData.username as string) ?? '';

    // ── Step 4: DB に保存（upsert） ───────────────────────
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    await prisma.socialConnection.upsert({
      where:  { clinicId_platform: { clinicId, platform: 'threads' } },
      update: { platformUserId: userId, username, accessToken, tokenExpiresAt: expiresAt, isActive: true },
      create: { clinicId, platform: 'threads', platformUserId: userId, username, accessToken, tokenExpiresAt: expiresAt },
    });

    return NextResponse.redirect(`${appUrl}/settings?threads=success&username=${username}`);
  } catch (err) {
    console.error('Threads callback error:', err);
    return NextResponse.redirect(`${appUrl}/settings?threads=error&reason=server_error`);
  }
}
