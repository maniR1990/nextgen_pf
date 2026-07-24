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

    const dir = sort === 'date_asc' ? 'asc' : 'desc';

    return prisma.financeTransaction.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      // `date` alone isn't unique — many rows share the same calendar day (time-of-day is
      // stripped). Without a tiebreaker, ties have no guaranteed order across pages, so a
      // same-day row can silently land on a page past the cursor and never surface in the
      // paginated list. `id` as a secondary key makes the sort — and cursor pagination — stable.
      orderBy: [{ date: dir }, { id: dir }],
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

  // Bulk-create idempotency replay: idempotencyKey is @unique, so only the anchor
  // (first) row of a batch can carry the client's key — find it, then expand via
  // billBatchId to return every sibling row created alongside it.
  findByIdempotencyKey: (key: string) =>
    prisma.financeTransaction.findUnique({ where: { idempotencyKey: key } }),

  findByBatchId: (userId: string, billBatchId: string) =>
    prisma.financeTransaction.findMany({
      where: { userId, billBatchId },
      include: TX_INCLUDE,
      orderBy: { createdAt: 'asc' },
    }),

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

  // Ad-hoc report query — any combination of category/type/account, with or without a
  // period (omitting year+month means "all time"). Backs the Reports page's filter
  // widget. Returns actual + recurring-actual in one round trip since both share the
  // same where clause modulo isRecurring.
  sumFiltered: async (
    userId: string,
    filters: {
      year?: number;
      month?: number;
      /** Already expanded to include descendant category ids by the caller — see
       *  ReportsService.getFilteredReport. A plain `{ in: [...] }` match here. */
      categoryIds?: string[];
      type?: TxType;
      accountId?: string;
    },
  ) => {
    const where: Prisma.FinanceTransactionWhereInput = {
      userId,
      status: { not: 'VOID' },
      ...(filters.year !== undefined &&
        filters.month !== undefined && {
          budgetPeriodYear: filters.year,
          budgetPeriodMonth: filters.month,
        }),
      ...(filters.categoryIds &&
        filters.categoryIds.length > 0 && { categoryId: { in: filters.categoryIds } }),
      ...(filters.type && { type: filters.type as never }),
      ...(filters.accountId && { accountId: filters.accountId }),
    };

    const [totals, recurringTotals] = await Promise.all([
      prisma.financeTransaction.aggregate({ where, _sum: { amount: true }, _count: true }),
      prisma.financeTransaction.aggregate({
        where: { ...where, isRecurring: true },
        _sum: { amount: true },
      }),
    ]);

    return {
      actual: totals._sum.amount ?? 0,
      count: totals._count,
      recurringActual: recurringTotals._sum.amount ?? 0,
    };
  },

  // Whole-period totals by type — used for the Income/Expense/Net summary card. Must NOT
  // be derived from a paginated list: any period with more rows than the page size would
  // silently under-count until every page is loaded.
  sumByTypeForPeriod: (userId: string, year: number, month: number) =>
    prisma.financeTransaction.groupBy({
      by: ['type'],
      where: {
        userId,
        budgetPeriodYear: year,
        budgetPeriodMonth: month,
        status: { not: 'VOID' },
      },
      _sum: { amount: true },
    }),

  // Full transaction rows for a period, unpaginated — used by the dashboard calendar,
  // which needs every transaction to render its per-day dots and the click-a-day detail
  // panel, not just an aggregate. A single user's month is always small enough to fetch
  // whole; do not reach for this for anything list-shaped (use findWithCursor instead).
  findAllForPeriod: (userId: string, year: number, month: number) =>
    prisma.financeTransaction.findMany({
      where: {
        userId,
        budgetPeriodYear: year,
        budgetPeriodMonth: month,
        status: { not: 'VOID' },
      },
      select: {
        id: true,
        date: true,
        type: true,
        amount: true,
        merchant: true,
        category: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    }),

  // Spend with no category assigned, grouped by type, for a period — the money a
  // category-grouped view (budget-by-category) can never see, since it groups strictly
  // by categoryId. Lives here rather than in budget-engine because "which transactions
  // count, by type, for a period" is a transactions-domain question — every caller that
  // needs a period total for any reason should be able to find it in one place.
  sumUncategorizedByTypeForPeriod: (userId: string, year: number, month: number) =>
    prisma.financeTransaction.groupBy({
      by: ['type'],
      where: {
        userId,
        budgetPeriodYear: year,
        budgetPeriodMonth: month,
        AND: [
          { OR: [{ categoryId: null }, { categoryId: { isSet: false } }] },
          // MongoDB stores absent fields differently from explicit null.
          // isSet: false matches documents where voidedAt was never written.
          { OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }] },
        ],
      },
      _sum: { amount: true },
    }),

  // Lifetime net balance per Fund, from transfers explicitly tagged with fundId/fundFlow —
  // money in (IN) minus money out (OUT). Not period-scoped: a sinking fund's "how much have
  // I saved toward this so far" is a running total across every month, not one month's worth.
  sumTransfersByFund: async (userId: string, fundIds: string[]) => {
    if (fundIds.length === 0) return new Map<string, number>();
    const rows = await prisma.financeTransaction.groupBy({
      by: ['fundId', 'fundFlow'],
      where: {
        userId,
        fundId: { in: fundIds },
        OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }],
      },
      _sum: { amount: true },
    });
    const balances = new Map<string, number>(fundIds.map((id) => [id, 0]));
    for (const row of rows) {
      if (!row.fundId) continue;
      const amount = row._sum.amount ?? 0;
      const signed = row.fundFlow === 'OUT' ? -amount : amount;
      balances.set(row.fundId, (balances.get(row.fundId) ?? 0) + signed);
    }
    return balances;
  },

  // Every recurring-linked transaction ever generated for a user, oldest first — used by the
  // subscription-audit widget to detect price creep (comparing the last two amounts charged
  // per template). Small, bounded by "how many recurring templates a person has", not by total
  // transaction volume, so fetching the whole history is fine.
  findRecurringHistory: (userId: string) =>
    prisma.financeTransaction.findMany({
      where: {
        userId,
        recurringTemplateId: { not: null },
        status: { not: 'VOID' },
      },
      select: { recurringTemplateId: true, amount: true, date: true },
      orderBy: { date: 'asc' },
    }),
};
