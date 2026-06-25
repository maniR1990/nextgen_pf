import { prisma } from '@/lib/db/prisma';

export const AuthRepository = {
  deleteVerificationTokensByUserId: (userId: string) =>
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),

  createVerificationToken: (userId: string, token: string, expiresAt: Date) =>
    prisma.emailVerificationToken.create({ data: { userId, token, expiresAt } }),

  findVerificationToken: (token: string) =>
    prisma.emailVerificationToken.findUnique({ where: { token }, include: { user: true } }),

  deleteVerificationToken: (id: string) =>
    prisma.emailVerificationToken.delete({ where: { id } }),

  deletePasswordResetTokensByUserId: (userId: string) =>
    prisma.passwordResetToken.deleteMany({ where: { userId } }),

  createPasswordResetToken: (userId: string, token: string, expiresAt: Date) =>
    prisma.passwordResetToken.create({ data: { userId, token, expiresAt } }),

  findPasswordResetToken: (token: string) =>
    prisma.passwordResetToken.findUnique({ where: { token }, include: { user: true } }),

  deletePasswordResetToken: (id: string) =>
    prisma.passwordResetToken.delete({ where: { id } }),

  markPasswordResetUsed: (id: string) =>
    prisma.passwordResetToken.update({ where: { id }, data: { used: true } }),

  incrementFailedLogin: async (userId: string) => {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: 1 } },
    });
    return user.failedLoginCount;
  },

  resetFailedLogin: (userId: string) =>
    prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
    }),

  lockUser: (userId: string, lockedUntil: Date) =>
    prisma.user.update({ where: { id: userId }, data: { lockedUntil } }),

  upsertOAuthAccount: (data: {
    userId: string;
    provider: string;
    providerAccountId: string;
    accessToken?: string;
  }) =>
    prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: data.provider,
          providerAccountId: data.providerAccountId,
        },
      },
      create: data,
      update: {
        accessToken: data.accessToken,
        userId: data.userId,
      },
    }),
};
