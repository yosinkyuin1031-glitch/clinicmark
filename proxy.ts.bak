import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // 認証済みユーザーがloginページに来たらダッシュボードへ（proxy.ts: Next.js 16対応）
    if (req.nextUrl.pathname === '/login' && req.nextauth.token) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // /login は未認証でもOK
        if (req.nextUrl.pathname.startsWith('/login')) return true;
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
