import { BudgetPeriodInvalidError, CategoryNotFoundError } from '@/lib/api/errors';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import { BudgetEngineRepository } from './budget-engine.repository';
import type { BudgetCategoryNode, BudgetGroup, BudgetSummaryResponse } from './budget-engine.types';

const MAX_FUTURE_MONTHS = 24;

function validatePeriod(year: number, month: number) {
  const now = new Date();
  if (year < 2020 || month < 1 || month > 12) throw new BudgetPeriodInvalidError();
  const monthsAhead = (year - now.getFullYear()) * 12 + (month - now.getMonth() - 1);
  if (monthsAhead > MAX_FUTURE_MONTHS) throw new BudgetPeriodInvalidError();
}

type RawCategory = {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  type: string;
  color: string | null;
  icon: string | null;
  order: number;
  isSystem: boolean;
};

type RawCategoryWithArchive = RawCategory & { archivedAt: Date | null };

/**
 * An archived category only belongs in a given month's tree if it has real
 * history (a Budget plan or transactions) IN THAT EXACT month — otherwise
 * archiving it would either resurrect it into months it never touched (in
 * particular every future month) or, if left unfiltered entirely, vanish
 * from months where it has genuine past data. Ancestors of a historically-
 * active archived category are pulled in too (regardless of their own
 * activity) so the tree-building step below never orphans it for lacking a
 * parent — e.g. archiving a whole subtree together archives the parent too.
 */
function resolveVisibleCategories(
  allCategories: RawCategoryWithArchive[],
  activeInPeriod: Set<string>,
): RawCategoryWithArchive[] {
  const active = allCategories.filter((c) => c.archivedAt == null);
  const archived = allCategories.filter((c) => c.archivedAt != null);
  if (archived.length === 0 || activeInPeriod.size === 0) return active;

  const byId = new Map(allCategories.map((c) => [c.id, c]));
  const included = new Set<string>();
  for (const id of activeInPeriod) {
    let cur = byId.get(id);
    while (cur && !included.has(cur.id)) {
      included.add(cur.id);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
  }

  return [...active, ...archived.filter((c) => included.has(c.id))];
}

type InternalNode = BudgetCategoryNode & {
  parentId: string | null;
  _type: string;
  _order: number;
  lastMonthActual: number; // rolled up same as actual
};

function computeMetrics(node: BudgetCategoryNode) {
  const { planned, actual } = node;
  node.variance = actual - planned;
  node.variancePct = planned > 0 ? Math.round((node.variance / planned) * 100) : 0;
  node.progressPct = planned > 0 ? Math.round((actual / planned) * 100) : actual > 0 ? 100 : 0;
  for (const child of node.children) computeMetrics(child);
}

function rollupNode(node: InternalNode): {
  planned: number;
  actual: number;
  lastMonthActual: number;
} {
  if (node.children.length === 0) {
    return { planned: node.planned, actual: node.actual, lastMonthActual: node.lastMonthActual };
  }
  let childPlanned = 0;
  let childActual = 0;
  let childLastMonth = 0;
  for (const child of node.children as InternalNode[]) {
    const r = rollupNode(child);
    child.planned = r.planned;
    child.actual = r.actual;
    child.lastMonthActual = r.lastMonthActual;
    childPlanned += r.planned;
    childActual += r.actual;
    childLastMonth += r.lastMonthActual;
  }
  node.planned = childPlanned;
  node.actual = node.actual + childActual;
  node.lastMonthActual = node.lastMonthActual + childLastMonth;
  return { planned: node.planned, actual: node.actual, lastMonthActual: node.lastMonthActual };
}

const GROUP_TYPE_ORDER: Record<string, number> = {
  INCOME: 0,
  EXPENSE: 1,
  INVESTMENT: 2,
  TRANSFER: 3,
};

export const BudgetEngineService = {
  async getMonthlySummary(
    userId: string,
    year: number,
    month: number,
  ): Promise<BudgetSummaryResponse> {
    validatePeriod(year, month);

    const [allCategories, budgetPlans] = await Promise.all([
      BudgetEngineRepository.findCategoriesForUser(userId),
      BudgetEngineRepository.findBudgetPlans(userId, year, month),
    ]);

    const archivedIds = allCategories.filter((c) => c.archivedAt != null).map((c) => c.id);
    const activeInPeriod =
      archivedIds.length > 0
        ? await BudgetEngineRepository.findCategoriesWithActivityInPeriod(
            userId,
            archivedIds,
            year,
            month,
          )
        : new Set<string>();
    const rawCategories = resolveVisibleCategories(allCategories, activeInPeriod);

    const categoryIds = rawCategories.map((c) => c.id);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const [spendRows, lastMonthSpendRows, uncategorizedRows, lastMonthUncategorizedRows] =
      await Promise.all([
        BudgetEngineRepository.findSpendByCategory(userId, categoryIds, year, month),
        BudgetEngineRepository.findSpendByCategory(userId, categoryIds, prevYear, prevMonth),
        // Lives on TransactionRepository, not here — "which transactions have no
        // category, by type" is a transactions-domain query every caller shares.
        TransactionRepository.sumUncategorizedByTypeForPeriod(userId, year, month),
        TransactionRepository.sumUncategorizedByTypeForPeriod(userId, prevYear, prevMonth),
      ]);

    const planMap = new Map(budgetPlans.map((p) => [p.categoryId, p]));
    const spendMap = new Map(spendRows.map((r) => [r.categoryId!, r._sum.amount ?? 0]));
    const lastMonthSpendMap = new Map(
      lastMonthSpendRows.map((r) => [r.categoryId!, r._sum.amount ?? 0]),
    );
    const uncategorizedMap = new Map<string, number>(
      uncategorizedRows.map((r) => [r.type, r._sum.amount ?? 0]),
    );
    const lastMonthUncategorizedMap = new Map<string, number>(
      lastMonthUncategorizedRows.map((r) => [r.type, r._sum.amount ?? 0]),
    );

    // Build node map
    const nodeMap = new Map<string, InternalNode>();
    for (const cat of rawCategories as RawCategory[]) {
      const plan = planMap.get(cat.id);
      nodeMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        level: cat.level,
        icon: cat.icon,
        color: cat.color,
        isSystem: cat.isSystem,
        isRecurring: plan?.isRecurring ?? false,
        isUnplanned: plan?.isUnplanned ?? false,
        dueDay: plan?.dueDay ?? null,
        isSettled: plan?.settledAt != null,
        settledTransactionId: plan?.settledTransactionId ?? null,
        planned: plan?.plannedAmount ?? 0,
        actual: spendMap.get(cat.id) ?? 0,
        lastMonthActual: lastMonthSpendMap.get(cat.id) ?? 0,
        variance: 0,
        variancePct: 0,
        progressPct: 0,
        children: [],
        parentId: cat.parentId,
        _type: cat.type,
        _order: cat.order,
        isVirtual: false,
      });
    }

    // Wire children to parents
    const groups: InternalNode[] = [];
    for (const node of nodeMap.values()) {
      if (node.level === 0) {
        groups.push(node);
      } else if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          (parent.children as InternalNode[]).push(node);
        }
      }
    }

    // Surface uncategorized spend as its own read-only row per group, rather than
    // letting findSpendByCategory's categoryId grouping silently drop it — a
    // transaction with no category has nowhere else in this tree to be counted.
    for (const group of groups) {
      const actual = uncategorizedMap.get(group._type) ?? 0;
      const lastMonthActual = lastMonthUncategorizedMap.get(group._type) ?? 0;
      if (actual === 0 && lastMonthActual === 0) continue;

      (group.children as InternalNode[]).push({
        id: `uncategorized-${group._type}`,
        name: 'Uncategorized',
        level: 1,
        icon: null,
        color: null,
        isSystem: true,
        isRecurring: false,
        isUnplanned: false,
        dueDay: null,
        isSettled: false,
        settledTransactionId: null,
        planned: 0,
        actual,
        lastMonthActual,
        variance: 0,
        variancePct: 0,
        progressPct: 0,
        children: [],
        parentId: group.id,
        _type: group._type,
        _order: Number.MAX_SAFE_INTEGER,
        isVirtual: true,
      });
    }

    // Sort children by order
    const sortChildren = (node: InternalNode) => {
      (node.children as InternalNode[]).sort((a, b) => a._order - b._order);
      for (const child of node.children as InternalNode[]) sortChildren(child);
    };
    for (const group of groups) sortChildren(group);

    // Rollup + compute metrics
    for (const group of groups) {
      rollupNode(group);
      computeMetrics(group);
    }

    // Sort groups: INCOME → EXPENSE → INVESTMENT → TRANSFER
    groups.sort((a, b) => (GROUP_TYPE_ORDER[a._type] ?? 9) - (GROUP_TYPE_ORDER[b._type] ?? 9));

    const result: BudgetGroup[] = groups.map((g) => ({
      id: g.id,
      name: g.name,
      type: g._type,
      planned: g.planned,
      actual: g.actual,
      lastMonthActual: g.lastMonthActual,
      variance: g.variance,
      variancePct: g.variancePct,
      progressPct: g.progressPct,
      categories: g.children as BudgetCategoryNode[],
    }));

    return { year, month, groups: result };
  },

  async getImpact(
    userId: string,
    input: {
      categoryId: string;
      amount: number;
      budgetPeriodYear: number;
      budgetPeriodMonth: number;
    },
  ) {
    validatePeriod(input.budgetPeriodYear, input.budgetPeriodMonth);

    const cat = await BudgetEngineRepository.findCategoryById(input.categoryId, userId);
    if (!cat) throw new CategoryNotFoundError();

    const plan = await BudgetEngineRepository.findBudgetPlan(
      userId,
      input.budgetPeriodYear,
      input.budgetPeriodMonth,
      input.categoryId,
    );
    const plannedAmount = plan?.plannedAmount ?? 0;

    const agg = await TransactionRepository.sumByPeriod(
      userId,
      input.budgetPeriodYear,
      input.budgetPeriodMonth,
      input.categoryId,
    );
    const currentSpend = agg._sum.amount ?? 0;
    const projectedSpend = currentSpend + input.amount;
    const remainingAfter = plannedAmount - projectedSpend;
    const willExceed = plannedAmount > 0 && projectedSpend > plannedAmount;

    return {
      categoryId: input.categoryId,
      categoryLabel: cat.name,
      plannedAmount,
      currentSpend,
      projectedSpend,
      remainingAfter,
      willExceed,
      percentUsedAfter: plannedAmount > 0 ? Math.round((projectedSpend / plannedAmount) * 100) : 0,
    };
  },

  async updateCategoryPlanned(
    userId: string,
    year: number,
    month: number,
    categoryId: string,
    data: {
      planned?: number;
      isRecurring?: boolean;
      isUnplanned?: boolean;
      dueDay?: number | null;
      /** true = mark this period's due item settled; false = clear settlement (undo). */
      settled?: boolean;
      /** Transaction that settled it, if any — omitted for a pure manual "mark as paid". */
      settledTransactionId?: string | null;
    },
  ) {
    validatePeriod(year, month);
    const cat = await BudgetEngineRepository.findCategoryById(categoryId, userId);
    if (!cat) throw new CategoryNotFoundError();
    return BudgetEngineRepository.upsertBudgetPlan(userId, year, month, categoryId, {
      ...(data.planned !== undefined && { plannedAmount: data.planned }),
      ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }),
      ...(data.isUnplanned !== undefined && { isUnplanned: data.isUnplanned }),
      ...(data.dueDay !== undefined && { dueDay: data.dueDay }),
      // Every settlement made through this endpoint today is user-initiated (Quick Pay
      // confirm, or the manual "mark as paid" toggle) — AUTO_MATCHED is reserved for a
      // future background-reconciliation pass, not used yet.
      ...(data.settled === true && {
        settledAt: new Date(),
        settledTransactionId: data.settledTransactionId ?? null,
        settlementMode: 'MANUAL' as const,
      }),
      ...(data.settled === false && {
        settledAt: null,
        settledTransactionId: null,
        settlementMode: null,
      }),
    });
  },

  /** Copies recurring plans from the previous month into the target month (skips existing plans). */
  async seedRecurring(userId: string, year: number, month: number) {
    validatePeriod(year, month);

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const [recurringPlans, existingIds] = await Promise.all([
      BudgetEngineRepository.findRecurringPlans(userId, prevYear, prevMonth),
      BudgetEngineRepository.existingPlanCategoryIds(userId, year, month),
    ]);

    const toSeed = recurringPlans.filter((p) => !existingIds.has(p.categoryId));

    await Promise.all(
      toSeed.map((p) =>
        BudgetEngineRepository.upsertBudgetPlan(userId, year, month, p.categoryId, {
          plannedAmount: p.plannedAmount,
          isRecurring: true,
          isUnplanned: p.isUnplanned,
          dueDay: p.dueDay ?? undefined,
          carryOverEnabled: p.carryOverEnabled,
        }),
      ),
    );

    return { seeded: toSeed.length };
  },
};
