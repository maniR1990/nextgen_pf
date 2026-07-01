import { v1Ok } from '@/lib/api/v1/envelope';
import { prisma } from '@/lib/db/prisma';
import type { Middleware } from './types';

export function withIdempotency(): Middleware {
  return (handler) => async (req, ctx) => {
    const key = req.headers.get('x-idempotency-key');
    if (!key) return handler(req, ctx);

    const existing = await prisma.financeTransaction.findUnique({
      where: { idempotencyKey: key },
    });

    if (existing) {
      // 10-minute TTL: short enough to prevent abuse, long enough to dedupe retries
      const age = Date.now() - existing.createdAt.getTime();
      if (age < 600_000) {
        return v1Ok(existing, 200);
      }
    }

    return handler(req, ctx);
  };
}
