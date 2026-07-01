import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });
}

export const prisma: PrismaClient = global.__prisma ?? createClient();

// In dev, reuse across hot-reloads to avoid exhausting connection pool.
// In prod, the module is loaded once per worker — no global needed.
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Eagerly open the connection pool so the first real request isn't slowed
// by lazy-connect overhead (~50–200 ms on cold start).
prisma.$connect().catch((err) => {
  console.error('[prisma] failed to connect on startup:', err);
});
