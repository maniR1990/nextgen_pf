import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
    // Default interactive-transaction timeout (5000ms) is tuned for a DB on the same
    // host as the app. On Vercel -> MongoDB Atlas, network latency alone can eat a
    // meaningful chunk of that budget, and a transaction that does a few sequential
    // awaits (e.g. TransactionService.patch: one update + up to two balance
    // updateMany calls) can cross 5s under normal latency, not just under load. When
    // it does, Prisma closes the transaction out from under the in-flight query with
    // "Transaction already closed... expired transaction" — a false-positive 500 with
    // nothing actually wrong. Raised to give real cross-region round-trips headroom.
    transactionOptions: {
      maxWait: 5_000, // time allowed to acquire a transaction slot from the pool
      timeout: 20_000, // time allowed for the whole interactive transaction to run
    },
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
