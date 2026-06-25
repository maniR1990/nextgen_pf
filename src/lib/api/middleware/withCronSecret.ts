import { UnauthorizedError } from '../errors';
import { error } from '../response';
import type { Handler } from './types';

export function withCronSecret(handler: Handler): Handler {
  return async (req, ctx) => {
    const secret = req.headers.get('authorization');
    if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
      return error(new UnauthorizedError());
    }
    return handler(req, ctx);
  };
}
