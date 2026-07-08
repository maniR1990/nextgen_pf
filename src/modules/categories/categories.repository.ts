import { prisma } from '@/lib/db/prisma';
import type { CategoryFlowType, Prisma } from '@prisma/client';

const CATEGORY_SELECT = {
  id: true,
  userId: true,
  name: true,
  slug: true,
  parentId: true,
  level: true,
  path: true,
  type: true,
  monthlyBudget: true,
  budgetRollover: true,
  matchRules: true,
  color: true,
  icon: true,
  order: true,
  isSystem: true,
  isActive: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export const CategoriesRepository = {
  findAccessible: async (
    userId: string,
    options: { includeArchived?: boolean; type?: CategoryFlowType },
  ) => {
    // Prisma v5+ MongoDB: `{ field: null }` only matches explicitly-stored null, not absent fields.
    // Categories are created without archivedAt, so the field is absent in MongoDB documents.
    // Filter archivedAt in JS to handle both null and absent.
    const typeWhere = options.type ? { type: options.type } : {};
    const [userRows, systemRows] = await Promise.all([
      prisma.category.findMany({
        where: { userId, ...typeWhere },
        select: CATEGORY_SELECT,
      }),
      prisma.category.findMany({
        where: { userId: null, isSystem: true, ...typeWhere },
        select: CATEGORY_SELECT,
      }),
    ]);
    const notArchived = <T extends { archivedAt: Date | null }>(rows: T[]) =>
      options.includeArchived ? rows : rows.filter((r) => r.archivedAt == null);
    return [...notArchived(userRows), ...notArchived(systemRows)].sort(
      (a, b) => a.level - b.level || a.order - b.order || a.name.localeCompare(b.name),
    );
  },

  countAccessible: async (
    userId: string,
    options: { includeArchived?: boolean; type?: CategoryFlowType },
  ) => {
    const typeWhere = options.type ? { type: options.type } : {};
    const [userRows, systemRows] = await Promise.all([
      prisma.category.findMany({
        where: { userId, ...typeWhere },
        select: { id: true, archivedAt: true },
      }),
      prisma.category.findMany({
        where: { userId: null, isSystem: true, ...typeWhere },
        select: { id: true, archivedAt: true },
      }),
    ]);
    const notArchived = (rows: { archivedAt: Date | null }[]) =>
      options.includeArchived ? rows.length : rows.filter((r) => r.archivedAt == null).length;
    return notArchived(userRows) + notArchived(systemRows);
  },

  findById: (id: string) =>
    prisma.category.findUniqueOrThrow({ where: { id }, select: CATEGORY_SELECT }),

  findByUserAndSlug: (userId: string, slug: string) =>
    prisma.category.findFirst({
      where: { userId, slug },
      select: { id: true },
    }),

  countTransactions: (categoryId: string) =>
    prisma.financeTransaction.count({
      where: { categoryId, OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }] },
    }),

  // Every model that carries a categoryId FK — used to decide whether a category
  // (or subtree) is safe to hard-delete, or must be archived to preserve history.
  // Includes voided transactions deliberately: a voided transaction is still history.
  countLinkedRecords: async (categoryIds: string[]) => {
    if (categoryIds.length === 0) return 0;
    const where = { categoryId: { in: categoryIds } };
    const [tx, budgets, overrides, events, recurring, aliases] = await Promise.all([
      prisma.financeTransaction.count({ where }),
      prisma.budget.count({ where }),
      prisma.budgetOverride.count({ where }),
      prisma.event.count({ where }),
      prisma.recurringTemplate.count({ where }),
      prisma.merchantAlias.count({ where }),
    ]);
    return tx + budgets + overrides + events + recurring + aliases;
  },

  spendByCategoryIds: (userId: string, categoryIds: string[], year: number, month: number) => {
    if (categoryIds.length === 0) return Promise.resolve([]);
    return prisma.financeTransaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        categoryId: { in: categoryIds },
        budgetPeriodYear: year,
        budgetPeriodMonth: month,
        OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }],
      },
      _sum: { amount: true },
    });
  },

  spendTrend: (userId: string, categoryId: string, months: number) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    return prisma.financeTransaction.findMany({
      where: {
        userId,
        categoryId,
        OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }],
        date: { gte: start },
      },
      select: {
        amount: true,
        budgetPeriodYear: true,
        budgetPeriodMonth: true,
      },
    });
  },

  topTransactions: (
    userId: string,
    categoryId: string,
    year: number,
    month: number,
    take: number,
  ) =>
    prisma.financeTransaction.findMany({
      where: {
        userId,
        categoryId,
        budgetPeriodYear: year,
        budgetPeriodMonth: month,
        OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }],
      },
      orderBy: { amount: 'desc' },
      take,
      select: {
        id: true,
        date: true,
        merchant: true,
        amount: true,
        type: true,
        status: true,
      },
    }),

  create: (data: Prisma.CategoryCreateInput) =>
    prisma.category.create({ data, select: CATEGORY_SELECT }),

  update: (id: string, data: Prisma.CategoryUpdateInput) =>
    prisma.category.update({ where: { id }, data, select: CATEGORY_SELECT }),

  delete: (id: string) => prisma.category.delete({ where: { id } }),

  deleteMany: (ids: string[]) => prisma.category.deleteMany({ where: { id: { in: ids } } }),

  archive: (id: string) =>
    prisma.category.update({
      where: { id },
      data: { archivedAt: new Date(), isActive: false },
      select: CATEGORY_SELECT,
    }),

  archiveMany: (ids: string[]) =>
    prisma.$transaction(
      ids.map((id) =>
        prisma.category.update({
          where: { id },
          data: { archivedAt: new Date(), isActive: false },
        }),
      ),
    ),

  reorder: (updates: Array<{ id: string; data: Prisma.CategoryUpdateInput }>) =>
    prisma.$transaction(
      updates.map(({ id, data }) =>
        prisma.category.update({ where: { id }, data, select: CATEGORY_SELECT }),
      ),
    ),
};
