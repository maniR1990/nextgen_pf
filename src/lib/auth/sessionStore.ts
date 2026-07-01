import { AUTH } from '@/constants/auth';
import { prisma } from '@/lib/db/prisma';

// ── Blacklist cache ────────────────────────────────────────────────────────────
//
// Problem: every authenticated API call hit MongoDB to check revokedAccessToken,
// even though >99% of tokens are never revoked. This added a full DB round-trip
// before the actual handler ran.
//
// Solution: in-process TTL cache keyed by JTI.
//   • Non-revoked tokens  → cached for CACHE_TTL_MS (60 s). Safe because even
//     if a token is revoked while cached, the worst-case window is 60 s — far
//     shorter than the 15-min token lifetime — and revoked tokens are rare.
//   • Revoked tokens      → cached permanently (until the process restarts).
//     Revocation is intentional and shouldn't be un-done.
//
// In a multi-replica deployment swap this for Redis (same interface, network key).

const CACHE_TTL_MS = 60_000; // 60 s — well under the 15-min token lifetime

interface CacheEntry {
  revoked: boolean;
  expiresAt: number; // monotonic ms — only meaningful for non-revoked entries
}

// Node.js module singleton: one Map per worker process, shared across all routes.
const blacklistCache = new Map<string, CacheEntry>();

function isEntryFresh(entry: CacheEntry): boolean {
  // Revoked entries never expire (the fact stays true).
  return entry.revoked || Date.now() < entry.expiresAt;
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function isAccessTokenBlacklisted(jti: string): Promise<boolean> {
  const cached = blacklistCache.get(jti);
  if (cached && isEntryFresh(cached)) return cached.revoked;

  // Cache miss or stale — go to DB.
  const record = await prisma.revokedAccessToken.findUnique({ where: { jti } });

  let revoked = false;
  if (record) {
    if (record.expiresAt > new Date()) {
      revoked = true;
    } else {
      // Expired revocation record — clean up opportunistically (fire-and-forget).
      prisma.revokedAccessToken.delete({ where: { jti } }).catch(() => {});
    }
  }

  blacklistCache.set(jti, {
    revoked,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return revoked;
}

export async function blacklistAccessToken(jti: string): Promise<void> {
  const expiresAt = new Date(Date.now() + AUTH.ACCESS_TOKEN_TTL_SEC * 1000);
  await prisma.revokedAccessToken.create({ data: { jti, expiresAt } });
  // Write-through: immediately mark revoked in cache so other in-flight requests
  // on the same worker don't serve a stale "not revoked" answer.
  blacklistCache.set(jti, { revoked: true, expiresAt: Number.POSITIVE_INFINITY });
}

// ── Refresh token helpers (unchanged) ─────────────────────────────────────────

export async function storeRefreshToken(jti: string, userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_TTL_SEC * 1000);
  await prisma.refreshToken.create({ data: { jti, userId, expiresAt } });
}

export async function getRefreshTokenUserId(jti: string): Promise<string | null> {
  const record = await prisma.refreshToken.findUnique({ where: { jti } });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { jti } });
    return null;
  }
  return record.userId;
}

export async function revokeRefreshToken(jti: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { jti } });
}

export async function purgeExpiredSessionTokens(): Promise<void> {
  const now = new Date();
  await Promise.all([
    prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.revokedAccessToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
}
