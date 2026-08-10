import { NotFoundError } from '../errors';
import { describe, expect, it, vi } from 'vitest';
import type { RouteContext } from './types';

vi.mock('@/lib/auth/jwt', () => ({
  verifyAccessToken: vi.fn(),
}));
vi.mock('@/lib/auth/sessionStore', () => ({
  isAccessTokenBlacklisted: vi.fn().mockResolvedValue(false),
}));

import { verifyAccessToken } from '@/lib/auth/jwt';
import { isAccessTokenBlacklisted } from '@/lib/auth/sessionStore';
import { withAuth } from './withAuth';

const ctx: RouteContext = {};

function reqWithToken(token?: string): Request {
  return new Request('http://localhost/api/v1/test', {
    headers: token ? { cookie: `access_token=${token}` } : {},
  });
}

const VALID_PAYLOAD = { sub: 'user1', email: 'a@b.com', role: 'USER', jti: 'jti1' };

describe('withAuth', () => {
  it('returns 401 when no access token cookie is present', async () => {
    const handler = withAuth()(async () => Response.json({ ok: true }));
    const res = await handler(reqWithToken(), ctx);
    expect(res.status).toBe(401);
  });

  it('returns 401 when the access token fails verification', async () => {
    vi.mocked(verifyAccessToken).mockRejectedValueOnce(new Error('bad token'));
    const handler = withAuth()(async () => Response.json({ ok: true }));
    const res = await handler(reqWithToken('bad'), ctx);
    expect(res.status).toBe(401);
  });

  it('returns 401 when the token is blacklisted', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(VALID_PAYLOAD as never);
    vi.mocked(isAccessTokenBlacklisted).mockResolvedValueOnce(true);
    const handler = withAuth()(async () => Response.json({ ok: true }));
    const res = await handler(reqWithToken('valid'), ctx);
    expect(res.status).toBe(401);
  });

  it('passes session through to the handler on a valid token', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce(VALID_PAYLOAD as never);
    let receivedSession: unknown;
    const handler = withAuth()(async (_req, innerCtx) => {
      receivedSession = innerCtx.session;
      return Response.json({ ok: true });
    });
    const res = await handler(reqWithToken('valid'), ctx);
    expect(res.status).toBe(200);
    expect(receivedSession).toEqual({ id: 'user1', email: 'a@b.com', role: 'USER' });
  });

  // Regression: the auth check succeeding doesn't mean nothing downstream can fail.
  // This used to catch ANY exception from the wrapped handler — a Prisma error, a bug,
  // anything — and report it back as a generic 401 Unauthorized, which reads as "your
  // session expired" for problems that have nothing to do with auth. A user chasing
  // that message would refresh their session (which succeeds, since it was never the
  // problem) and still hit the same failure on retry.
  describe('errors thrown by the wrapped handler (auth already succeeded)', () => {
    it('preserves the real status for one of our own ApiErrors', async () => {
      vi.mocked(verifyAccessToken).mockResolvedValueOnce(VALID_PAYLOAD as never);
      const handler = withAuth()(async () => {
        throw new NotFoundError('Transaction not found');
      });
      const res = await handler(reqWithToken('valid'), ctx);
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: { code: string; message: string } };
      expect(body.error.code).toBe('NOT_FOUND');
    });

    it('falls back to 500, not 401, for a raw unexpected exception', async () => {
      vi.mocked(verifyAccessToken).mockResolvedValueOnce(VALID_PAYLOAD as never);
      const handler = withAuth()(async () => {
        throw new Error('Prisma exploded');
      });
      const res = await handler(reqWithToken('valid'), ctx);
      expect(res.status).toBe(500);
      const body = (await res.json()) as { error: { code: string } };
      expect(body.error.code).not.toBe('UNAUTHORIZED');
    });
  });
});
