import { prisma } from '@/lib/db/prisma';

export const BudgetEngineRepository = {
  /**
   * All non-archived categories visible to a user:
   *   - User-owned categories (level 1+, created by the user)
   *   - System categories (level 0 group nodes: Income / Expenses / Investments)
   *
   * MongoDB stores absent fields as missing, not null, so we filter archivedAt in JS
   * the same way CategoriesRepository.findAccessible does.
   */
  findCategoriesForUser: async (userId: string) => {
    const SELECT = {
      id: true,
      name: true,
      level: true,
      parentId: true,
      type: true,
      color: true,
      icon: true,
      order: true,
      isSystem: true,
      userId: true,
      archivedAt: true, // needed to filter in JS (MongoDB absent ≠ null)
    } as const;

    const [userRows, systemRows] = await Promise.all([
      prisma.category.findMany({ where: { userId }, select: SELECT }),
      prisma.category.findMany({ where: { userId: null, isSystem: true }, select: SELECT }),
    ]);

    return [...userRows, ...systemRows]
      .filter((r) => r.archivedAt == null)
      .sort((a, b) => a.level - b.level || a.order - b.order)
      .map(({ archivedAt: _drop, userId: _uid, ...rest }) => rest);
  },

  /** Single category — checks user-owned first, then system categories. */
  findCategoryById: (id: string, userId: string) =>
    prisma.category.findFirst({
      where: { id, OR: [{ userId }, { userId: null, isSystem: true }] },
      select: { id: true, name: true, level: true },
    }),

  /** Budget plans for a specific month. */
  findBudgetPlans: (userId: string, year: number, month: number) =>
    prisma.budget.findMany({
      where: { userId, period: 'MONTHLY', year, month },
      select: {
        categoryId: true,
        plannedAmount: true,
        isRecurring: true,
        isUnplanned: true,
        dueDay: true,
        carryOverEnabled: true,
        carryOverAmount: true,
        settledAt: true,
        settledTransactionId: true,
        settlementMode: true,
      },
    }),

  /** Single budget plan — used by impact calculation. */
  findBudgetPlan: (userId: string, year: number, month: number, categoryId: string) =>
    prisma.budget.findFirst({
      where: { userId, period: 'MONTHLY', year, month, categoryId },
      select: { plannedAmount: true, isRecurring: true, isUnplanned: true },
    }),

  /** Batch spend grouped by categoryId for a period. */
  findSpendByCategory: (userId: string, categoryIds: string[], year: number, month: number) => {
    if (categoryIds.length === 0) return Promise.resolve([]);
    return prisma.financeTransaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        categoryId: { in: categoryIds },
        budgetPeriodYear: year,
        budgetPeriodMonth: month,
        // MongoDB stores absent fields differently from explicit null.
        // isSet: false matches documents where voidedAt was never written.
        OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }],
      },
      _sum: { amount: true },
    });
  },

  /** Upsert a budget plan for a specific category + period. */
  upsertBudgetPlan: (
    userId: string,
    year: number,
    month: number,
    categoryId: string,
    data: {
      plannedAmount?: number;
      isRecurring?: boolean;
      isUnplanned?: boolean;
      dueDay?: number | null;
      carryOverEnabled?: boolean;
      settledAt?: Date | null;
      settledTransactionId?: string | null;
      settlementMode?: 'MANUAL' | 'AUTO_MATCHED' | null;
    },
  ) =>
    prisma.budget.upsert({
      where: {
        userId_period_year_month_categoryId: { userId, period: 'MONTHLY', year, month, categoryId },
      },
      create: {
        userId,
        period: 'MONTHLY',
        year,
        month,
        categoryId,
        plannedAmount: data.plannedAmount ?? 0,
        isRecurring: data.isRecurring ?? false,
        isUnplanned: data.isUnplanned ?? false,
        carryOverEnabled: data.carryOverEnabled ?? false,
        ...(data.dueDay !== undefined && { dueDay: data.dueDay }),
        ...(data.settledAt !== undefined && { settledAt: data.settledAt }),
        ...(data.settledTransactionId !== undefined && {
          settledTransactionId: data.settledTransactionId,
        }),
        ...(data.settlementMode !== undefined && { settlementMode: data.settlementMode }),
      },
      update: {
        ...(data.plannedAmount !== undefined && { plannedAmount: data.plannedAmount }),
        ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
        ...(data.isUnplanned !== undefined && { isUnplanned: data.isUnplanned }),
        ...(data.carryOverEnabled !== undefined && { carryOverEnabled: data.carryOverEnabled }),
        ...(data.dueDay !== undefined && { dueDay: data.dueDay }),
        ...(data.settledAt !== undefined && { settledAt: data.settledAt }),
        ...(data.settledTransactionId !== undefined && {
          settledTransactionId: data.settledTransactionId,
        }),
        ...(data.settlementMode !== undefined && { settlementMode: data.settlementMode }),
      },
    }),

  /** Recurring plans from a specific month — used to seed the next month. */
  findRecurringPlans: (userId: string, year: number, month: number) =>
    prisma.budget.findMany({
      where: { userId, period: 'MONTHLY', year, month, isRecurring: true },
      select: {
        categoryId: true,
        plannedAmount: true,
        isUnplanned: true,
        dueDay: true,
        carryOverEnabled: true,
      },
    }),

  /** Category IDs that already have a plan in the given period (for seeding de-dupe). */
  existingPlanCategoryIds: async (userId: string, year: number, month: number) => {
    const rows = await prisma.budget.findMany({
      where: { userId, period: 'MONTHLY', year, month },
      select: { categoryId: true },
    });
    return new Set(rows.map((r) => r.categoryId));
  },
};
