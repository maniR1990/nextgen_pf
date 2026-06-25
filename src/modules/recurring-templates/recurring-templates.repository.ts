import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const INCLUDE = {
  category: { select: { id: true, name: true } },
  account: { select: { id: true, name: true } },
  toAccount: { select: { id: true, name: true } },
} satisfies Prisma.RecurringTemplateInclude;

export const RecurringTemplatesRepository = {
  findByUserId: (userId: string) =>
    prisma.recurringTemplate.findMany({
      where: { userId },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    }),

  findById: (id: string) =>
    prisma.recurringTemplate.findUniqueOrThrow({ where: { id }, include: INCLUDE }),

  create: (data: Prisma.RecurringTemplateCreateInput) =>
    prisma.recurringTemplate.create({ data, include: INCLUDE }),

  update: (id: string, data: Prisma.RecurringTemplateUpdateInput) =>
    prisma.recurringTemplate.update({ where: { id }, data, include: INCLUDE }),

  updateLastGenerated: (id: string) =>
    prisma.recurringTemplate.update({ where: { id }, data: { lastGeneratedDate: new Date() } }),

  createTransaction: (data: Prisma.FinanceTransactionCreateInput) =>
    prisma.financeTransaction.create({ data }),
};
