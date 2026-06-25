import type { AccountGroupSort } from '@/constants/account-groups';
import type { AccountGroupType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const GROUP_SELECT = {
  id: true,
  name: true,
  type: true,
  slug: true,
  order: true,
  icon: true,
  color: true,
  isDefault: true,
  isCollapsed: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
} satisfies Prisma.AccountGroupSelect;

function sortOrderBy(sort: AccountGroupSort): Prisma.AccountGroupOrderByWithRelationInput {
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

export const AccountGroupsRepository = {
  findMany: (
    userId: string,
    options: {
      skip: number;
      take: number;
      sort: AccountGroupSort;
      includeArchived?: boolean;
      type?: AccountGroupType;
    },
  ) =>
    prisma.accountGroup.findMany({
      where: {
        userId,
        ...(options.type && { type: options.type }),
        ...(!options.includeArchived && { archivedAt: null }),
      },
      select: GROUP_SELECT,
      orderBy: sortOrderBy(options.sort),
      skip: options.skip,
      take: options.take,
    }),

  countMany: (
    userId: string,
    options: { includeArchived?: boolean; type?: AccountGroupType },
  ) =>
    prisma.accountGroup.count({
      where: {
        userId,
        ...(options.type && { type: options.type }),
        ...(!options.includeArchived && { archivedAt: null }),
      },
    }),

  findById: (id: string) =>
    prisma.accountGroup.findUniqueOrThrow({
      where: { id },
      select: GROUP_SELECT,
    }),

  findByUserAndSlug: (userId: string, slug: string) =>
    prisma.accountGroup.findFirst({
      where: { userId, slug },
      select: { id: true },
    }),

  countAccountsInGroup: (groupId: string, includeArchivedAccounts = false) =>
    prisma.account.count({
      where: {
        groupId,
        ...(!includeArchivedAccounts && { archivedAt: null }),
      },
    }),

  aggregateBalancesByGroup: (userId: string, groupIds: string[]) => {
    if (groupIds.length === 0) return Promise.resolve([]);
    return prisma.account.groupBy({
      by: ['groupId'],
      where: {
        userId,
        groupId: { in: groupIds },
        archivedAt: null,
      },
      _count: { id: true },
      _sum: { balance: true },
    });
  },

  create: (data: Prisma.AccountGroupCreateInput) =>
    prisma.accountGroup.create({ data, select: GROUP_SELECT }),

  update: (id: string, data: Prisma.AccountGroupUpdateInput) =>
    prisma.accountGroup.update({ where: { id }, data, select: GROUP_SELECT }),

  archive: (id: string) =>
    prisma.accountGroup.update({
      where: { id },
      data: { archivedAt: new Date() },
      select: GROUP_SELECT,
    }),

  delete: (id: string) => prisma.accountGroup.delete({ where: { id } }),

  reorder: (updates: Array<{ id: string; order: number }>) =>
    prisma.$transaction(
      updates.map(({ id, order }) =>
        prisma.accountGroup.update({
          where: { id },
          data: { order },
          select: GROUP_SELECT,
        }),
      ),
    ),

  maxOrder: (userId: string) =>
    prisma.accountGroup.aggregate({
      where: { userId, archivedAt: null },
      _max: { order: true },
    }),
};
