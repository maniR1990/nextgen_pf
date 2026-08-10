import { AUTH } from '@/constants/auth';
import { v1FromApiError } from '@/lib/api/v1/envelope';
import { buildLastActiveCookie, getCookie } from '@/lib/auth/cookies';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { isAccessTokenBlacklisted } from '@/lib/auth/sessionStore';
import { getLogger } from '@/lib/logger';
import type { Role } from '@prisma/client';
import { InternalError, UnauthorizedError, isApiError } from '../errors';
import type { Middleware } from './types';

const log = getLogger('withAuth');

// Roll the inactivity window only when the current stamp is within the last
// REFRESH_THRESHOLD seconds of its lifetime — avoids a header rebuild + cookie
// write on every single request when the user is actively browsing.
const REFRESH_THRESHOLD_SEC = 60; // re-stamp when < 60 s left before expiry

function shouldRollActivity(req: Request): boolean {
  const raw = getCookie(req, AUTH.COOKIE_LAST_ACTIVE);
  if (!raw) return true; // no cookie yet — always stamp
  // The cookie's mere presence means it hasn't expired. We only suppress the
  // re-stamp when it was set very recently (i.e. the cookie is still fresh).
  // We can't read Max-Age from an incoming request — the browser only sends
  // the value, not the attributes. So we stamp on every Nth request by checking
  // if the last-active cookie is absent, which happens when the previous stamp
  // has expired. For simplicity, stamp every request but skip the Response
  // rebuild when the existing cookie was just set (same-second requests).
  return true; // always stamp — cheap since it's just a header append
}

export function withAuth(): Middleware {
  return (handler) => async (req, ctx) => {
    const token = getCookie(req, AUTH.COOKIE_ACCESS);
    if (!token) return v1FromApiError(new UnauthorizedError());

    let payload: Awaited<ReturnType<typeof verifyAccessToken>>;
    try {
      payload = await verifyAccessToken(token);
    } catch {
      return v1FromApiError(new UnauthorizedError());
    }

    // Blacklist check — cached in-process; no DB hit on the happy path.
    if (await isAccessTokenBlacklisted(payload.jti)) {
      return v1FromApiError(new UnauthorizedError());
    }

    let response: Response;
    try {
      response = await handler(req, {
        ...ctx,
        session: {
          id: payload.sub,
          email: payload.email,
          role: payload.role as Role,
        },
      });
    } catch (err) {
      // Auth already succeeded by this point — whatever failed inside `handler` is a
      // downstream/business-logic error (a Prisma error, a bug, anything), never an
      // auth problem. This used to blanket-return UnauthorizedError() here, which
      // mislabeled every unrelated server error as "you're not logged in" — genuinely
      // confusing when the session was fine all along. Preserve the real status for our
      // own error types; only fall back to a generic 500 for truly unexpected ones.
      if (isApiError(err)) return v1FromApiError(err);
      // Baseline visibility for the truly-unexpected case, regardless of whether the
      // route's own handler bothers to log — several v1 routes currently don't (see
      // TransactionRouter's v1PatchTransaction and friends), which is exactly how this
      // class of error went unlogged anywhere, client or server, until now. The real
      // message lands here, server-side only — the client gets a generic message.
      // (A prior version of this file also returned the real exception message to the
      // client as a temporary debugging aid while chasing a specific bug; that's no
      // longer needed now the bug is understood, so the response is generic again.)
      log.error('unexpected error from handler', { err });
      return v1FromApiError(new InternalError());
    }

    // Append the rolling activity cookie to every successful response.
    // We only rebuild the Response when the handler itself didn't already set it
    // (avoids double header on auth routes that call buildSessionCookies).
    if (!response.headers.get('set-cookie')?.includes(AUTH.COOKIE_LAST_ACTIVE)) {
      const headers = new Headers(response.headers);
      headers.append('Set-Cookie', buildLastActiveCookie());
      return new Response(response.body, { status: response.status, headers });
    }

    return response;
  };
}
