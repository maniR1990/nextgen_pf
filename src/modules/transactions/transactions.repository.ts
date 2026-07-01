import type { TxType } from '@/constants/finance';
import { prisma } from '@/lib/db/prisma';
import type { FinanceTransactionStatus, Prisma } from '@prisma/client';

export const TX_INCLUDE = {
  category: { select: { id: true, name: true, path: true } },
  account: { select: { id: true, name: true, type: true } },
  toAccount: { select: { id: true, name: true } },
  attachmentFiles: {
    where: { deletedAt: null },
    select: {
      id: true,
      filename: true,
      url: true,
      mimeType: true,
      sizeBytes: true,
      uploadedAt: true,
    },
  },
} satisfies Prisma.FinanceTransactionInclude;

export const TransactionRepository = {
  findById: (id: string) =>
    prisma.financeTransaction.findUniqueOrThrow({
      where: { id },
      include: TX_INCLUDE,
    }),

  findWithCursor: (
    userId: string,
    options: {
      cursor?: string;
      limit?: number;
      type?: TxType;
      types?: TxType[];
      budgetPeriodYear?: number;
      budgetPeriodMonth?: number;
      fromDate?: Date;
      toDate?: Date;
      categoryId?: string;
      paymentSourceId?: string;
      status?: FinanceTransactionStatus;
      search?: string;
      sort?: 'date_desc' | 'date_asc';
    } = {},
  ) => {
    const {
      cursor,
      limit = 20,
      type,
      types,
      budgetPeriodYear,
      budgetPeriodMonth,
      fromDate,
      toDate,
      categoryId,
      paymentSourceId,
      status,
      search,
      sort = 'date_desc',
    } = options;

    const typeFilter = types && types.length > 0 ? { type: { in: types } } : type ? { type } : {};

    const where: Prisma.FinanceTransactionWhereInput = {
      userId,
      ...typeFilter,
      ...(budgetPeriodYear != null && { budgetPeriodYear }),
      ...(budgetPeriodMonth != null && { budgetPeriodMonth }),
      ...(categoryId && { categoryId }),
      ...(paymentSourceId && { accountId: paymentSourceId }),
      ...(status && { status }),
      ...(fromDate || toDate
        ? { date: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
        : {}),
      ...(search && { merchant: { contains: search, mode: 'insensitive' as const } }),
    };

    return prisma.financeTransaction.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { date: sort === 'date_asc' ? 'asc' : 'desc' },
      include: TX_INCLUDE,
    });
  },

  // Legacy OFFSET — kept for backward compat with existing /api/transactions
  findByUserId: (
    userId: string,
    options: {
      skip?: number;
      take?: number;
      type?: TxType;
      fromDate?: Date;
      toDate?: Date;
      categoryId?: string;
      search?: string;
    } = {},
  ) => {
    const { skip = 0, take = 20, type, fromDate, toDate, categoryId, search } = options;
    const where: Prisma.FinanceTransactionWhereInput = {
      userId,
      ...(type && { type }),
      ...(categoryId && { categoryId }),
      ...(fromDate || toDate
        ? { date: { ...(fromDate && { gte: fromDate }), ...(toDate && { lte: toDate }) } }
        : {}),
      ...(search && { merchant: { contains: search, mode: 'insensitive' as const } }),
    };
    return prisma.financeTransaction.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        account: { select: { id: true, name: true, type: true } },
      },
    });
  },

  countByUserId: (userId: string) => prisma.financeTransaction.count({ where: { userId } }),

  create: (data: Prisma.FinanceTransactionCreateInput) =>
    prisma.financeTransaction.create({ data, include: TX_INCLUDE }),

  update: (id: string, data: Prisma.FinanceTransactionUpdateInput) =>
    prisma.financeTransaction.update({ where: { id }, data, include: TX_INCLUDE }),

  hardDelete: (id: string) => prisma.financeTransaction.delete({ where: { id } }),

  findDuplicates: (userId: string, merchant: string, amount: number, date: Date) => {
    const threeDaysAgo = new Date(date);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysLater = new Date(date);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    return prisma.financeTransaction.findMany({
      where: {
        userId,
        merchant: { equals: merchant, mode: 'insensitive' },
        amount,
        date: { gte: threeDaysAgo, lte: threeDaysLater },
        status: { not: 'VOID' },
      },
      select: { id: true, date: true, merchant: true, amount: true, accountId: true },
      take: 1,
    });
  },

  void: (id: string) =>
    prisma.financeTransaction.update({
      where: { id },
      data: { status: 'VOID', voidedAt: new Date() },
      include: TX_INCLUDE,
    }),

  // Aggregate spend for budget impact calculation
  sumByPeriod: (userId: string, year: number, month: number, categoryId?: string) =>
    prisma.financeTransaction.aggregate({
      where: {
        userId,
        budgetPeriodYear: year,
        budgetPeriodMonth: month,
        status: { not: 'VOID' },
        ...(categoryId && { categoryId }),
      },
      _sum: { amount: true },
    }),
};
