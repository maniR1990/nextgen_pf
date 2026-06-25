import { purgeExpiredSessionTokens } from '@/lib/auth/sessionStore';
import { prisma } from '@/lib/db/prisma';
import { getLogger } from '@/lib/logger';

const log = getLogger('CleanupJob');

export const CleanupJob = {
  run: async () => {
    const now = new Date();
    const [, resetTokens, verifyTokens] = await Promise.all([
      purgeExpiredSessionTokens(),
      prisma.passwordResetToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: now } }, { used: true }] },
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    log.info('cleanup.completed', {
      resetTokens: resetTokens.count,
      verifyTokens: verifyTokens.count,
    });
  },
};
