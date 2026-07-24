import { BudgetEngineService } from '@/modules/budget-engine';
import type { BudgetCategoryNode } from '@/modules/budget-engine/budget-engine.types';
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

export interface ReportFilterResult {
  actual: number;
  count: number;
  recurringActual: number;
  /** null when not computable: Budget plans have no account dimension (so an account
   *  filter narrows below what a plan represents) and are only tracked per calendar
   *  month (so "all time" has no single plan to sum). */
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
}

export const ReportsService = {
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

    const { actual, count, recurringActual } = await TransactionRepository.sumFiltered(userId, {
      year: filters.year,
      month: filters.month,
      type: filters.type,
      accountId: filters.accountId,
      categoryIds,
    });

    let planned: number | null = null;
    if (filters.year !== undefined && filters.month !== undefined && !filters.accountId) {
      const summary = await BudgetEngineService.getMonthlySummary(
        userId,
        filters.year,
        filters.month,
      );
      if (filters.categoryIds && filters.categoryIds.length > 0 && flatCategories) {
        // Each selected id's own `.planned` is already the budget-engine's rolled-up sum
        // for that node's whole subtree — summing per selected root (not per expanded
        // descendant) avoids double-counting a child that's also inside a selected
        // parent's rollup. The picker already prevents selecting a category alongside its
        // own ancestor/descendant, but the API is reachable directly too, so this drops
        // any selected id that's covered by another selected id before summing — defense
        // in depth, not just a UI nicety.
        const roots = filters.categoryIds;
        const independentIds = roots.filter(
          (id) => !roots.some((other) => other !== id && isDescendant(flatCategories!, other, id)),
        );
        const allNodes = summary.groups.flatMap((g) => g.categories);
        planned = independentIds.reduce(
          (sum, id) => sum + (findNode(allNodes, id)?.planned ?? 0),
          0,
        );
      } else if (filters.type) {
        planned = summary.groups
          .filter((g) => g.type === filters.type)
          .reduce((sum, g) => sum + g.planned, 0);
      } else {
        planned = summary.groups.reduce((sum, g) => sum + g.planned, 0);
      }
    }

    const variance = planned !== null ? actual - planned : null;
    const pctOfPlanned = planned !== null && planned > 0 ? Math.round((actual / planned) * 100) : null;

    let pctOfIncome: number | null = null;
    let incomeForPeriod: number | null = null;

    if (filters.year !== undefined && filters.month !== undefined) {
      const periodTotals = await getPeriodTotals(userId, filters.year, filters.month);
      pctOfIncome =
        periodTotals.totalIncome > 0
          ? Math.round((actual / periodTotals.totalIncome) * 1000) / 10
          : null;
      incomeForPeriod = periodTotals.totalIncome;
    }

    return {
      actual,
      count,
      recurringActual,
      planned,
      variance,
      pctOfPlanned,
      pctOfIncome,
      incomeForPeriod,
    };
  },
};
