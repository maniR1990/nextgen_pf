import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const notArchived = { NOT: { archivedAt: { isSet: true, not: null } } } as const;

const SELECT = {
  id: true,
  userId: true,
  name: true,
  description: true,
  slug: true,
  purposeHint: true,
  order: true,
  color: true,
  isSystem: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FundGroupSelect;

export const FundGroupsRepository = {
  findByUserId: (userId: string, includeArchived = false) =>
    prisma.fundGroup.findMany({
      where: { userId, ...(includeArchived ? {} : notArchived) },
      select: SELECT,
      orderBy: [{ archivedAt: 'asc' }, { order: 'asc' }],
    }),

  findById: (id: string) =>
    prisma.fundGroup.findUniqueOrThrow({ where: { id }, select: SELECT }),

  create: (data: Prisma.FundGroupCreateInput) =>
    prisma.fundGroup.create({ data, select: SELECT }),

  update: (id: string, data: Prisma.FundGroupUpdateInput) =>
    prisma.fundGroup.update({ where: { id }, data, select: SELECT }),

  softDelete: async (id: string): Promise<void> => {
    await prisma.fundGroup.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  },

  countFunds: (groupId: string) =>
    prisma.fund.count({ where: { groupId, ...notArchived } }),

  findByIds: (ids: string[]) => {
    if (ids.length === 0) return Promise.resolve([]);
    return prisma.fundGroup.findMany({ where: { id: { in: ids } }, select: SELECT });
  },

  maxOrder: (userId: string) =>
    prisma.fundGroup.aggregate({
      where: { userId, ...notArchived },
      _max: { order: true },
    }),

  slugExists: (userId: string, slug: string) =>
    prisma.fundGroup.count({ where: { userId, slug } }).then((n) => n > 0),

  restore: async (id: string): Promise<void> => {
    await prisma.fundGroup.update({
      where: { id },
      data: { archivedAt: null },
    });
  },
};
