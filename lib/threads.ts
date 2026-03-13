// Threads API ヘルパー

const THREADS_API_BASE = 'https://graph.threads.net/v1.0';

export function getThreadsAuthUrl(clinicId: string): string {
  const appId = process.env.THREADS_APP_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL}/api/threads/callback`;
  const scope = 'threads_basic,threads_content_publish';
  const state = clinicId; // clinicIdをstateに含める
  return `https://threads.net/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code&state=${state}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  user_id: string;
}> {
  const res = await fetch('https://graph.threads.net/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.THREADS_APP_ID!,
      client_secret: process.env.THREADS_APP_SECRET!,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL}/api/threads/callback`,
      code,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
}

export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(
    `${THREADS_API_BASE}/access_token?grant_type=th_exchange_token&client_secret=${process.env.THREADS_APP_SECRET}&access_token=${shortToken}`
  );
  if (!res.ok) throw new Error('Long-lived token exchange failed');
  return res.json();
}

export async function getThreadsProfile(accessToken: string): Promise<{
  id: string;
  username: string;
}> {
  const res = await fetch(
    `${THREADS_API_BASE}/me?fields=id,username&access_token=${accessToken}`
  );
  if (!res.ok) throw new Error('Failed to get Threads profile');
  return res.json();
}

export async function publishToThreads(
  userId: string,
  accessToken: string,
  text: string
): Promise<{ id: string }> {
  // Step 1: コンテナ作成
  const containerRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        media_type: 'TEXT',
        text,
        access_token: accessToken,
      }),
    }
  );
  if (!containerRes.ok) {
    const err = await containerRes.text();
    throw new Error(`Container creation failed: ${err}`);
  }
  const { id: containerId } = await containerRes.json();

  // Step 2: 公開
  const publishRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );
  if (!publishRes.ok) {
    const err = await publishRes.text();
    throw new Error(`Publish failed: ${err}`);
  }
  return publishRes.json();
}
