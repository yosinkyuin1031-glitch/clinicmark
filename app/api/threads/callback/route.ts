import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { exchangeCodeForToken, getLongLivedToken, getThreadsProfile } from '@/lib/threads';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const clinicId = searchParams.get('state');

  if (!code || !clinicId) {
    return NextResponse.redirect(new URL('/threads?error=missing_params', request.url));
  }

  try {
    // 短期トークン取得
    const { access_token: shortToken, user_id: userId } = await exchangeCodeForToken(code);

    // 長期トークンに交換（60日有効）
    const { access_token: longToken, expires_in } = await getLongLivedToken(shortToken);

    // プロフィール取得
    const profile = await getThreadsProfile(longToken);

    // DB保存（upsert）
    await prisma.socialConnection.upsert({
      where: { clinicId_platform: { clinicId, platform: 'threads' } },
      update: {
        accessToken: longToken,
        userId,
        username: profile.username,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
      create: {
        clinicId,
        platform: 'threads',
        accessToken: longToken,
        userId,
        username: profile.username,
        expiresAt: new Date(Date.now() + expires_in * 1000),
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
    return NextResponse.redirect(new URL('/threads?connected=true', baseUrl));
  } catch (e) {
    console.error('Threads OAuth error:', e);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || '';
    return NextResponse.redirect(new URL('/threads?error=auth_failed', baseUrl));
  }
}
