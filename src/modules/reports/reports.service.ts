import { BudgetEngineService } from '@/modules/budget-engine';
import type { BudgetCategoryNode } from '@/modules/budget-engine/budget-engine.types';
import { collectLeaves } from '@/modules/budget-engine/lib/collectLeaves';
import { CategoriesRepository } from '@/modules/categories/categories.repository';
import { collectDescendantIds, isDescendant } from '@/modules/categories/lib/category-tree';
import { getPeriodTotals } from '@/modules/transactions/period-spend';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import type { ReportFilterQuery } from './reports.schema';

function findNode(nodes: BudgetCategoryNode[], id: string): BudgetCategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return undefined;
}

export interface ReportFilterTypeBreakdown {
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  actual: number;
  recurringActual: number;
  count: number;
  planned: number | null;
  variance: number | null;
  pctOfIncome: number | null;
  /** INVESTMENT only — the split behind `actual`. Sinking Deposit isn't a selectable
   *  report `type` on its own (it's tracked via Funds, not categories), so without this
   *  split it would silently vanish from every report instead of counting as the
   *  savings it is. See getFilteredReport. */
  investmentActual?: number;
  sinkingActual?: number;
}

export interface ReportFilterResult {
  /** Total matching transactions across every type — a plain count is never ambiguous,
   *  so this stays populated even when `byType` is (see below). */
  count: number;
  /** Null when `byType` is populated instead — see `byType`. */
  actual: number | null;
  recurringActual: number | null;
  /** null when not computable: Budget plans have no account dimension (so an account
   *  filter narrows below what a plan represents) and are only tracked per calendar
   *  month (so "all time" has no single plan to sum). Also null when `byType` is
   *  populated instead. */
  planned: number | null;
  variance: number | null;
  pctOfPlanned: number | null;
  /** actual as a % of that month's total income — the "share of income" / savings-rate
   *  figure a financial review actually cares about, not just a raw rupee total. Null
   *  for an "all time" query (no single month's income to divide by) or when that
   *  month had zero income. */
  pctOfIncome: number | null;
  /** That month's total income in rupees — paired with pctOfIncome so a UI can show a
   *  plain "₹X of ₹Y income" instead of a bare percentage. Null under the same
   *  conditions as pctOfIncome. */
  incomeForPeriod: number | null;
  /** Populated instead of the single-number fields above only when no `type` filter is
   *  set AND no category is selected — i.e. a query with nothing to anchor "actual" to
   *  a single kind of money. Income, Expense, and Investment amounts mean different
   *  things (money in vs. money out vs. money set aside), so blending them into one
   *  rupee total is not a real number — it's just noise that happens to add up. Once a
   *  category is picked, its whole subtree already belongs to exactly one type, so
   *  there's nothing left to blend and the single-number fields above apply as normal. */
  byType: ReportFilterTypeBreakdown[] | null;
  /** Set only when `type=INVESTMENT` is selected directly (byType is null in that case)
   *  — same Investment/Sinking split as ReportFilterTypeBreakdown, see there for why. */
  investmentActual?: number;
  sinkingActual?: number;
}

export interface BudgetFlagCategory {
  id: string;
  name: string;
  /** Immediate parent's name, for a "Parent › Category" label — null for a top-level
   *  (L1) category, which needs no extra context. */
  parentName: string | null;
  amount: number;
}

export interface OverBudgetCategory extends BudgetFlagCategory {
  planned: number;
  /** amount - planned, i.e. how far over budget — always > 0 in this list. */
  over: number;
}

export interface BudgetFlagsResult {
  unplannedTotal: number;
  /** Sorted by amount, highest first. */
  unplanned: BudgetFlagCategory[];
  overBudgetTotal: number;
  /** Sorted by `over`, highest first. */
  overBudget: OverBudgetCategory[];
}

export const ReportsService = {
  /**
   * Two things worth a user's attention that neither the KPI strip nor the filter tool
   * surfaces on their own: spend flagged "unplanned" and categories that have actually
   * gone over their planned amount this month. Scoped to EXPENSE only — "unplanned
   * income" or "over-planned investment" isn't a warning in the same sense a budget
   * overrun is.
   *
   * "Unplanned" has two independent sources that both have to count:
   *  - Budget.isUnplanned — a whole-category flag set in the Budget page ("this budget
   *    line itself is irregular"), which counts that category's entire actual spend.
   *  - FinanceTransaction.isPlanned === false — the "Unplanned" checkbox on the Log
   *    Transaction form, which flags one specific transaction regardless of whether its
   *    category is otherwise a normal, planned budget line. This is the one most users
   *    actually touch day to day, and was previously not read here at all.
   * A category flagged at the budget level already counts its full actual spend, which
   * is always ≥ any subset of individually-flagged transactions inside it — so the two
   * sources are only combined by falling back to the transaction sum, never added
   * together, to avoid double-counting.
   */
  async getBudgetFlags(userId: string, year: number, month: number): Promise<BudgetFlagsResult> {
    const [summary, unplannedTxByCategory] = await Promise.all([
      BudgetEngineService.getMonthlySummary(userId, year, month),
      TransactionRepository.sumUnplannedByCategory(userId, year, month),
    ]);
    const unplannedTxAmount = new Map(
      unplannedTxByCategory.map((row) => [row.categoryId as string, row._sum.amount ?? 0]),
    );

    const leaves = summary.groups
      .filter((g) => g.type === 'EXPENSE')
      .flatMap((g) => collectLeaves(g.categories));

    const unplanned = leaves
      .map(({ node, parentName }) => ({
        node,
        parentName,
        amount: node.isUnplanned ? node.actual : (unplannedTxAmount.get(node.id) ?? 0),
      }))
      .filter(({ amount }) => amount > 0)
      .map(({ node, parentName, amount }) => ({
        id: node.id,
        name: node.name,
        parentName,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);

    const overBudget = leaves
      .filter(({ node }) => node.planned > 0 && node.actual > node.planned)
      .map(({ node, parentName }) => ({
        id: node.id,
        name: node.name,
        parentName,
        amount: node.actual,
        planned: node.planned,
        over: node.actual - node.planned,
      }))
      .sort((a, b) => b.over - a.over);

    return {
      unplannedTotal: unplanned.reduce((sum, u) => sum + u.amount, 0),
      unplanned,
      overBudgetTotal: overBudget.reduce((sum, o) => sum + o.over, 0),
      overBudget,
    };
  },

  async getFilteredReport(
    userId: string,
    filters: ReportFilterQuery,
  ): Promise<ReportFilterResult> {
    // A selected category almost never has transactions tagged with its own id directly
    // — real spend lives on the leaf categories underneath it ("Groceries" itself is
    // rarely picked at entry time; "Supermarket" under it is). So picking "Groceries" in
    // a report has to mean "Groceries + everything under it," not an exact-id match —
    // and picking several categories at once (e.g. "Groceries" + "Household") unions
    // each one's own subtree together.
    let categoryIds: string[] | undefined;
    let flatCategories: Awaited<ReturnType<typeof CategoriesRepository.findAccessible>> | undefined;
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      flatCategories = await CategoriesRepository.findAccessible(userId, {});
      const expanded = new Set<string>();
      for (const rootId of filters.categoryIds) {
        for (const id of collectDescendantIds(flatCategories, rootId)) expanded.add(id);
      }
      categoryIds = Array.from(expanded);
    }

    const hasCategory = !!filters.categoryIds && filters.categoryIds.length > 0;
    const hasPeriod = filters.year !== undefined && filters.month !== undefined;

    const summary = hasPeriod && !filters.accountId
      ? await BudgetEngineService.getMonthlySummary(userId, filters.year!, filters.month!)
      : null;
    const periodTotals = hasPeriod ? await getPeriodTotals(userId, filters.year!, filters.month!) : null;

    function plannedFor(type: 'EXPENSE' | 'INCOME' | 'INVESTMENT' | undefined): number | null {
      if (!summary) return null;
      if (hasCategory && flatCategories) {
        // Each selected id's own `.planned` is already the budget-engine's rolled-up sum
        // for that node's whole subtree — summing per selected root (not per expanded
        // descendant) avoids double-counting a child that's also inside a selected
        // parent's rollup. The picker already prevents selecting a category alongside its
        // own ancestor/descendant, but the API is reachable directly too, so this drops
        // any selected id that's covered by another selected id before summing — defense
        // in depth, not just a UI nicety.
        const roots = filters.categoryIds!;
        const independentIds = roots.filter(
          (id) => !roots.some((other) => other !== id && isDescendant(flatCategories!, other, id)),
        );
        const allNodes = summary.groups.flatMap((g) => g.categories);
        return independentIds.reduce((sum, id) => sum + (findNode(allNodes, id)?.planned ?? 0), 0);
      }
      if (type) {
        return summary.groups.filter((g) => g.type === type).reduce((sum, g) => sum + g.planned, 0);
      }
      return summary.groups.reduce((sum, g) => sum + g.planned, 0);
    }

    function pctOfIncomeFor(actual: number): number | null {
      if (!periodTotals || periodTotals.totalIncome <= 0) return null;
      return Math.round((actual / periodTotals.totalIncome) * 1000) / 10;
    }

    const incomeForPeriod = periodTotals ? periodTotals.totalIncome : null;

    // Sinking Deposit isn't a selectable report `type` (it's tracked via Funds, not
    // categories — see ReportFilterTypeBreakdown's doc comment), but it's savings just
    // like Investment, so it belongs in "Actual Invested" instead of vanishing. Queried
    // and kept separate so the caller can both merge it into the total AND show the
    // split, rather than picking one or the other.
    async function investmentPlusSinking(base: {
      year?: number;
      month?: number;
      accountId?: string;
      categoryIds?: string[];
    }) {
      const [investment, sinking] = await Promise.all([
        TransactionRepository.sumFiltered(userId, { ...base, type: 'INVESTMENT' }),
        TransactionRepository.sumFiltered(userId, { ...base, type: 'SINKING_DEPOSIT' }),
      ]);
      return {
        actual: investment.actual + sinking.actual,
        count: investment.count + sinking.count,
        recurringActual: investment.recurringActual + sinking.recurringActual,
        investmentActual: investment.actual,
        sinkingActual: sinking.actual,
      };
    }

    // "All types, no category" has nothing to anchor a single "actual" figure to — Income,
    // Expense, and Investment amounts don't mean the same thing, so summing them produces
    // a number that reads as real but isn't. Give a per-type breakdown instead; see the
    // `byType` doc comment above.
    if (!filters.type && !hasCategory) {
      const types = ['INCOME', 'EXPENSE', 'INVESTMENT'] as const;
      const byType = await Promise.all(
        types.map(async (type): Promise<ReportFilterTypeBreakdown> => {
          const base = { year: filters.year, month: filters.month, accountId: filters.accountId };
          const { actual, count, recurringActual, investmentActual, sinkingActual } =
            type === 'INVESTMENT'
              ? await investmentPlusSinking(base)
              : { ...(await TransactionRepository.sumFiltered(userId, { ...base, type })), investmentActual: undefined, sinkingActual: undefined };
          const planned = plannedFor(type);
          return {
            type,
            actual,
            recurringActual,
            count,
            planned,
            variance: planned !== null ? actual - planned : null,
            pctOfIncome: pctOfIncomeFor(actual),
            investmentActual,
            sinkingActual,
          };
        }),
      );

      return {
        count: byType.reduce((sum, b) => sum + b.count, 0),
        actual: null,
        recurringActual: null,
        planned: null,
        variance: null,
        pctOfPlanned: null,
        pctOfIncome: null,
        incomeForPeriod,
        byType,
      };
    }

    const base = { year: filters.year, month: filters.month, accountId: filters.accountId, categoryIds };
    const { actual, count, recurringActual, investmentActual, sinkingActual } =
      filters.type === 'INVESTMENT'
        ? await investmentPlusSinking(base)
        : { ...(await TransactionRepository.sumFiltered(userId, { ...base, type: filters.type })), investmentActual: undefined, sinkingActual: undefined };

    const planned = plannedFor(filters.type);
    const variance = planned !== null ? actual - planned : null;
    const pctOfPlanned = planned !== null && planned > 0 ? Math.round((actual / planned) * 100) : null;

    return {
      actual,
      count,
      recurringActual,
      planned,
      variance,
      pctOfPlanned,
      pctOfIncome: pctOfIncomeFor(actual),
      incomeForPeriod,
      byType: null,
      investmentActual,
      sinkingActual,
    };
  },
};
