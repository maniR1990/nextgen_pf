import type { Role } from '@prisma/client';
import { ForbiddenError } from '../errors';
import { error } from '../response';
import type { Middleware } from './types';

export function withRole(...roles: Role[]): Middleware {
  return (handler) => async (req, ctx) => {
    if (!ctx.session || !roles.includes(ctx.session.role)) {
      return error(new ForbiddenError());
    }
    return handler(req, ctx);
  };
}
