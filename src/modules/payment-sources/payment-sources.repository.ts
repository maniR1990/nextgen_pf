import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

const SELECT = {
  id: true,
  name: true,
  type: true,
  balance: true,
  institution: { select: { shortName: true } },
  accountNumber: true,
  creditLimit: true,
  status: true,
  createdAt: true,
} satisfies Prisma.AccountSelect;

export const PaymentSourcesRepository = {
  findByUserId: (userId: string) =>
    prisma.account.findMany({
      where: { userId, status: 'ACTIVE' },
      select: SELECT,
      orderBy: { name: 'asc' },
    }),

  findById: (id: string) => prisma.account.findUniqueOrThrow({ where: { id } }),

  updateBalance: (id: string, balance: number) =>
    prisma.account.update({
      where: { id },
      data: { balance, balanceAsOf: new Date() },
      select: SELECT,
    }),

  create: (data: Prisma.AccountCreateInput) => prisma.account.create({ data, select: SELECT }),

  findTransactions: (accountId: string, options: { take: number; cursor?: string }) =>
    prisma.financeTransaction.findMany({
      where: { accountId },
      take: options.take,
      ...(options.cursor && { cursor: { id: options.cursor }, skip: 1 }),
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        merchant: true,
        amount: true,
        type: true,
        status: true,
        category: { select: { id: true, name: true } },
      },
    }),
};
