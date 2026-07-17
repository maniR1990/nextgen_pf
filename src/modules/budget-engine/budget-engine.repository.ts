import { prisma } from '@/lib/db/prisma';

export const BudgetEngineRepository = {
  /**
   * ALL categories visible to a user — both active and archived, `archivedAt`
   * left intact. Archived rows aren't filtered out here: whether an archived
   * category belongs in a given month's tree depends on the requested period
   * (see BudgetEngineService.getMonthlySummary), so that decision is made by
   * the caller, not baked into this raw fetch.
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
      archivedAt: true, // needed to filter in JS (MongoDB absent ≠ null)
    } as const;

    const [userRows, systemRows] = await Promise.all([
      prisma.category.findMany({ where: { userId }, select: SELECT }),
      prisma.category.findMany({ where: { userId: null, isSystem: true }, select: SELECT }),
    ]);

    return [...userRows, ...systemRows].sort(
      (a, b) => a.level - b.level || a.order - b.order,
    );
  },

  /** Which of the given category IDs have a Budget plan or transactions in this exact period. */
  findCategoriesWithActivityInPeriod: async (
    userId: string,
    categoryIds: string[],
    year: number,
    month: number,
  ) => {
    if (categoryIds.length === 0) return new Set<string>();
    const [budgetRows, txRows] = await Promise.all([
      prisma.budget.findMany({
        where: { userId, period: 'MONTHLY', year, month, categoryId: { in: categoryIds } },
        select: { categoryId: true },
      }),
      prisma.financeTransaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          categoryId: { in: categoryIds },
          budgetPeriodYear: year,
          budgetPeriodMonth: month,
        },
      }),
    ]);
    return new Set([...budgetRows.map((r) => r.categoryId), ...txRows.map((r) => r.categoryId!)]);
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

  /** Batch spend grouped by categoryId for a period.
   *
   *  Assumes — but does not verify — that every transaction's `type` matches the `type`
   *  of the category it's tagged with (e.g. an EXPENSE transaction is never tagged with
   *  an INCOME-type category). Nothing in the schema or the write path enforces this; it
   *  holds only because every category picker in the UI already filters by the current
   *  transaction's type. If that ever stops being true — a bug elsewhere lets a
   *  transaction get tagged with a mismatched category — this rollup would silently
   *  misclassify that money into the wrong group (EXPENSE money counted as INCOME
   *  actual, or similar) without either side erroring. No enforcement was added here:
   *  FinanceTransactionType has 10 values against Category.type's 4, so a correct
   *  mapping between them (e.g. does a GIFT_RECEIVED transaction require an INCOME-type
   *  category, or its own?) is a real design decision that hasn't been made yet, and
   *  guessing wrong on a live write path risks rejecting valid transactions. */
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
