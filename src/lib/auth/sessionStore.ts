import { AUTH } from '@/constants/auth';
import { prisma } from '@/lib/db/prisma';

export async function storeRefreshToken(jti: string, userId: string) {
  const expiresAt = new Date(Date.now() + AUTH.REFRESH_TOKEN_TTL_SEC * 1000);
  await prisma.refreshToken.create({ data: { jti, userId, expiresAt } });
}

export async function getRefreshTokenUserId(jti: string) {
  const record = await prisma.refreshToken.findUnique({ where: { jti } });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { jti } });
    return null;
  }
  return record.userId;
}

export async function revokeRefreshToken(jti: string) {
  await prisma.refreshToken.deleteMany({ where: { jti } });
}

export async function blacklistAccessToken(jti: string) {
  const expiresAt = new Date(Date.now() + AUTH.ACCESS_TOKEN_TTL_SEC * 1000);
  await prisma.revokedAccessToken.create({ data: { jti, expiresAt } });
}

export async function isAccessTokenBlacklisted(jti: string) {
  const record = await prisma.revokedAccessToken.findUnique({ where: { jti } });
  if (!record) return false;
  if (record.expiresAt < new Date()) {
    await prisma.revokedAccessToken.delete({ where: { jti } });
    return false;
  }
  return true;
}

export async function purgeExpiredSessionTokens() {
  const now = new Date();
  await Promise.all([
    prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.revokedAccessToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);
}
