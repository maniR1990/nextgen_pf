import { AUTH } from '@/constants/auth';
import { v1FromApiError } from '@/lib/api/v1/envelope';
import { getCookie } from '@/lib/auth/cookies';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { isAccessTokenBlacklisted } from '@/lib/auth/sessionStore';
import type { Role } from '@prisma/client';
import { UnauthorizedError } from '../errors';
import type { Middleware } from './types';

export function withAuth(): Middleware {
  return (handler) => async (req, ctx) => {
    const token = getCookie(req, AUTH.COOKIE_ACCESS);
    if (!token) return v1FromApiError(new UnauthorizedError());

    try {
      const payload = await verifyAccessToken(token);
      if (await isAccessTokenBlacklisted(payload.jti)) {
        return v1FromApiError(new UnauthorizedError());
      }

      return handler(req, {
        ...ctx,
        session: {
          id: payload.sub,
          email: payload.email,
          role: payload.role as Role,
        },
      });
    } catch {
      return v1FromApiError(new UnauthorizedError());
    }
  };
}
