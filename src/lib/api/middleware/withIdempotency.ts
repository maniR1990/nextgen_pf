import { prisma } from '@/lib/db/prisma';
import { v1Ok } from '@/lib/api/v1/envelope';
import type { Middleware } from './types';

/**
 * Checks X-Idempotency-Key on POST requests.
 * If a transaction with that key already exists we return the cached result
 * instead of re-executing the handler. Keys expire after 24 h (enforced in
 * a periodic cleanup job — the DB check is the source of truth).
 */
export function withIdempotency(): Middleware {
  return (handler) => async (req, ctx) => {
    const key = req.headers.get('x-idempotency-key');
    if (!key) return handler(req, ctx);

    const existing = await prisma.financeTransaction.findUnique({
      where: { idempotencyKey: key },
    });

    if (existing) {
      // 24-hour TTL: reject stale replays
      const age = Date.now() - existing.createdAt.getTime();
      if (age < 86_400_000) {
        return v1Ok(existing, 200);
      }
    }

    return handler(req, ctx);
  };
}
