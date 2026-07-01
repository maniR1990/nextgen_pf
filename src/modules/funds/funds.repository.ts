import type { FundSort } from '@/constants/funds';
import { prisma } from '@/lib/db/prisma';
import type { FundPurpose, Prisma } from '@prisma/client';

// Prisma MongoDB stores optional DateTime as absent (not BSON null) when unset.
// { archivedAt: null } only matches BSON null; use isSet: false to match absent fields.
const notArchived = { NOT: { archivedAt: { isSet: true, not: null } } } as const;

const FUND_SELECT = {
  id: true,
  userId: true,
  name: true,
  purpose: true,
  groupId: true,
  targetAmount: true,
  targetMonths: true,
  sources: true,
  goalId: true,
  color: true,
  icon: true,
  order: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FundSelect;

function sortOrderBy(sort: FundSort): Prisma.FundOrderByWithRelationInput {
  switch (sort) {
    case 'order_desc':
      return { order: 'desc' };
    case 'name_asc':
      return { name: 'asc' };
    case 'name_desc':
      return { name: 'desc' };
    case 'created_desc':
      return { createdAt: 'desc' };
    default:
      return { order: 'asc' };
  }
}

export const FundsRepository = {
  findMany: (
    userId: string,
    options: {
      skip: number;
      take: number;
      sort: FundSort;
      includeArchived?: boolean;
      purpose?: FundPurpose;
    },
  ) =>
    prisma.fund.findMany({
      where: {
        userId,
        ...(options.purpose && { purpose: options.purpose }),
        ...(!options.includeArchived && notArchived),
      },
      select: FUND_SELECT,
      orderBy: sortOrderBy(options.sort),
      skip: options.skip,
      take: options.take,
    }),

  findAllActive: (userId: string) =>
    prisma.fund.findMany({
      where: { userId, ...notArchived },
      select: FUND_SELECT,
    }),

  countMany: (userId: string, options: { includeArchived?: boolean; purpose?: FundPurpose }) =>
    prisma.fund.count({
      where: {
        userId,
        ...(options.purpose && { purpose: options.purpose }),
        ...(!options.includeArchived && notArchived),
      },
    }),

  findById: (id: string) => prisma.fund.findUniqueOrThrow({ where: { id }, select: FUND_SELECT }),

  findAccountsByIds: (userId: string, ids: string[]) => {
    if (ids.length === 0) return Promise.resolve([]);
    return prisma.account.findMany({
      where: { userId, id: { in: ids }, archivedAt: null },
      select: { id: true, name: true, code: true, type: true, balance: true },
    });
  },

  findUserAccounts: (userId: string) =>
    prisma.account.findMany({
      where: { userId, archivedAt: null },
      select: { id: true, name: true, code: true, type: true, balance: true },
    }),

  create: (data: Prisma.FundCreateInput) => prisma.fund.create({ data, select: FUND_SELECT }),

  update: (id: string, data: Prisma.FundUpdateInput) =>
    prisma.fund.update({ where: { id }, data, select: FUND_SELECT }),

  maxOrder: (userId: string) =>
    prisma.fund.aggregate({
      where: { userId, ...notArchived },
      _max: { order: true },
    }),

  hardDelete: (id: string) => prisma.fund.delete({ where: { id } }),
};
