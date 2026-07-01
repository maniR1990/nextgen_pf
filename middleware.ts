import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const COOKIE_ACCESS = 'access_token';
const COOKIE_REFRESH = 'refresh_token';
const COOKIE_LAST_ACTIVE = 'last_active';

function getAccessSecret() {
  return new TextEncoder().encode(
    process.env.JWT_ACCESS_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'dev-access-secret',
  );
}

function redirectToLogin(req: NextRequest, reason: 'unauthenticated' | 'inactivity') {
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('callbackUrl', req.nextUrl.pathname);
  if (reason === 'inactivity') url.searchParams.set('reason', 'inactivity');

  const res = NextResponse.redirect(url);

  // Clear all session cookies so the client starts clean
  for (const name of [COOKIE_ACCESS, COOKIE_REFRESH, COOKIE_LAST_ACTIVE]) {
    res.cookies.set(name, '', { path: '/', maxAge: 0, httpOnly: true, sameSite: 'strict' });
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get(COOKIE_ACCESS)?.value;
  const refreshToken = req.cookies.get(COOKIE_REFRESH)?.value;
  const lastActive = req.cookies.get(COOKIE_LAST_ACTIVE)?.value;

  const hasSession = !!(accessToken || refreshToken);

  // ── 1. Inactivity timeout ─────────────────────────────────────────────────
  //    last_active is a rolling HttpOnly cookie with Max-Age=1800.
  //    If it's gone the browser already expired it → 30 min of no API activity.
  //    Only enforce when a session exists (avoids redirecting unauthenticated users
  //    with an inactivity reason instead of the plain login reason).
  if (hasSession && !lastActive) {
    return redirectToLogin(req, 'inactivity');
  }

  // ── 2. No session at all → login ──────────────────────────────────────────
  if (!hasSession) {
    return redirectToLogin(req, 'unauthenticated');
  }

  // ── 3. Valid access token → allow ─────────────────────────────────────────
  if (accessToken) {
    try {
      await jwtVerify(accessToken, getAccessSecret());
      return NextResponse.next();
    } catch {
      // Expired or tampered — fall through to refresh-token check
    }
  }

  // ── 4. Expired access token but refresh token present → allow ─────────────
  //    Client fetcher sees the 401, calls /api/auth/refresh, gets new cookies,
  //    retries the request. If refresh fails, fetchWithSession fires
  //    auth:session-expired and the modal prompts re-login.
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
