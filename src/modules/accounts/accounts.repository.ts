import type { AccountSort } from '@/constants/accounts';
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

const SUMMARY_SELECT = {
  id: true,
  name: true,
  code: true,
  type: true,
  subtype: true,
  balance: true,
  currency: true,
  status: true,
  isPrimary: true,
  isExcludeNetWorth: true,
  isHidden: true,
  institutionId: true,
  groupId: true,
  archivedAt: true,
} satisfies Prisma.AccountSelect;

const DETAIL_SELECT = {
  ...SUMMARY_SELECT,
  openingBalance: true,
  balanceAsOf: true,
  accountNumber: true,
  ifscCode: true,
  upiId: true,
  creditLimit: true,
  billingCycle: true,
  interestRate: true,
  minimumPayment: true,
  investedAmount: true,
  currentValue: true,
  absoluteReturn: true,
  xirr: true,
  maturityDate: true,
  lockInMonths: true,
  expectedReturn: true,
  category80C: true,
  principalAmount: true,
  emi: true,
  remainingEmis: true,
  interestPaidTotal: true,
  fundAllocations: true,
  linkedAccountIds: true,
  color: true,
  icon: true,
  note: true,
  tags: true,
  openedOn: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
} satisfies Prisma.AccountSelect;

function sortOrderBy(sort: AccountSort): Prisma.AccountOrderByWithRelationInput {
  switch (sort) {
    case 'name_desc':
      return { name: 'desc' };
    case 'balance_asc':
      return { balance: 'asc' };
    case 'balance_desc':
      return { balance: 'desc' };
    case 'type_asc':
      return { type: 'asc' };
    case 'created_desc':
      return { createdAt: 'desc' };
    default:
      return { name: 'asc' };
  }
}

export const AccountsRepository = {
  findGroupsByUserId: (userId: string) =>
    prisma.accountGroup.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    }),

  countByUserAndCodePrefix: (userId: string, prefix: string) =>
    prisma.account.count({
      where: { userId, code: { startsWith: prefix } },
    }),

  findInstitutionById: (id: string) =>
    prisma.institution.findUnique({ where: { id }, select: { shortName: true } }),

  findGroupById: (id: string) => prisma.accountGroup.findUnique({ where: { id } }),

  findMany: (
    userId: string,
    options: {
      skip: number;
      take: number;
      sort: AccountSort;
      includeArchived?: boolean;
      groupId?: string;
      type?: string;
    },
  ) =>
    prisma.account.findMany({
      where: {
        userId,
        ...(options.groupId && { groupId: options.groupId }),
        ...(options.type && { type: options.type as never }),
        ...(!options.includeArchived && { archivedAt: null }),
      },
      select: {
        ...SUMMARY_SELECT,
        group: { select: { id: true, name: true, type: true, slug: true } },
      },
      orderBy: sortOrderBy(options.sort),
      skip: options.skip,
      take: options.take,
    }),

  countMany: (
    userId: string,
    options: { includeArchived?: boolean; groupId?: string; type?: string },
  ) =>
    prisma.account.count({
      where: {
        userId,
        ...(options.groupId && { groupId: options.groupId }),
        ...(options.type && { type: options.type as never }),
        ...(!options.includeArchived && { archivedAt: null }),
      },
    }),

  findAllForNetWorth: (userId: string, includeArchived?: boolean) =>
    prisma.account.findMany({
      where: {
        userId,
        ...(!includeArchived && { archivedAt: null }),
      },
      select: {
        balance: true,
        isExcludeNetWorth: true,
        group: { select: { type: true } },
        currency: true,
      },
    }),

  findById: (id: string) =>
    prisma.account.findUniqueOrThrow({
      where: { id },
      select: DETAIL_SELECT,
    }),

  findSummariesByIds: (ids: string[], userId: string) =>
    prisma.account.findMany({
      where: { id: { in: ids }, userId },
      select: SUMMARY_SELECT,
    }),

  create: (data: Prisma.AccountUncheckedCreateInput) =>
    prisma.account.create({ data, select: DETAIL_SELECT }),

  update: (id: string, data: Prisma.AccountUncheckedUpdateInput) =>
    prisma.account.update({ where: { id }, data, select: DETAIL_SELECT }),

  archive: (id: string) =>
    prisma.account.update({
      where: { id },
      data: { archivedAt: new Date(), status: 'CLOSED' },
      select: DETAIL_SELECT,
    }),

  updateBalance: (id: string, balance: number) =>
    prisma.account.update({
      where: { id },
      data: { balance, balanceAsOf: new Date() },
      select: DETAIL_SELECT,
    }),

  findRecentTransactions: (accountId: string, take: number) =>
    prisma.financeTransaction.findMany({
      where: { accountId, voidedAt: null },
      take,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        type: true,
        amount: true,
        merchant: true,
        status: true,
      },
    }),

  findUpcomingEventsForAccount: (userId: string, fundIds: string[], after: Date, before: Date) => {
    if (fundIds.length === 0) return Promise.resolve([]);
    return prisma.event.findMany({
      where: {
        userId,
        status: 'UPCOMING',
        scheduledDate: { gte: after, lte: before },
        linkedFundId: { in: fundIds },
      },
      select: {
        id: true,
        name: true,
        scheduledDate: true,
        estimatedAmount: true,
      },
      orderBy: { scheduledDate: 'asc' },
      take: 10,
    });
  },

  deleteById: (id: string) => prisma.account.delete({ where: { id } }),

  runTransaction: <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(fn),
};
