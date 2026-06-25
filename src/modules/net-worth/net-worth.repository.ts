import { prisma } from '@/lib/db/prisma';

export const NetWorthRepository = {
  findAccountsWithGroups: (userId: string) =>
    prisma.account.findMany({
      where: { userId, archivedAt: null },
      select: {
        balance: true,
        currency: true,
        isExcludeNetWorth: true,
        group: { select: { id: true, name: true, type: true, slug: true } },
      },
    }),

  findMonthlyTransactionChanges: (userId: string, since: Date) =>
    prisma.financeTransaction.findMany({
      where: {
        userId,
        date: { gte: since },
        type: { in: ['INCOME', 'EXPENSE', 'INVESTMENT'] },
        status: { not: 'VOID' },
      },
      select: { budgetPeriodYear: true, budgetPeriodMonth: true, type: true, amount: true },
    }),
};
