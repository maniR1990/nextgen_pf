import { BudgetEngineService } from '@/modules/budget-engine';
import type { BudgetCategoryNode } from '@/modules/budget-engine/budget-engine.types';
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
  /** Same filters, previous calendar month. null for an "all time" query — there's no
   *  single previous period to compare against. */
  previousActual: number | null;
  /** (actual - previousActual) / previousActual * 100, one decimal. null when there's
   *  no previous-period baseline to compare against (previousActual is null or 0). */
  previousChangePct: number | null;
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
    const { actual, count, recurringActual } = await TransactionRepository.sumFiltered(
      userId,
      filters,
    );

    let planned: number | null = null;
    if (filters.year !== undefined && filters.month !== undefined && !filters.accountId) {
      const summary = await BudgetEngineService.getMonthlySummary(
        userId,
        filters.year,
        filters.month,
      );
      if (filters.categoryId) {
        planned = findNode(summary.groups.flatMap((g) => g.categories), filters.categoryId)?.planned ?? 0;
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

    let previousActual: number | null = null;
    let previousChangePct: number | null = null;
    let pctOfIncome: number | null = null;
    let incomeForPeriod: number | null = null;

    if (filters.year !== undefined && filters.month !== undefined) {
      // JS Date rolls a month index of -1 back into December of the prior year, so this
      // works correctly across a January boundary without a separate branch.
      const prevDate = new Date(filters.year, filters.month - 2, 1);
      const prevYear = prevDate.getFullYear();
      const prevMonth = prevDate.getMonth() + 1;

      const [prev, periodTotals] = await Promise.all([
        TransactionRepository.sumFiltered(userId, {
          ...filters,
          year: prevYear,
          month: prevMonth,
        }),
        getPeriodTotals(userId, filters.year, filters.month),
      ]);

      previousActual = prev.actual;
      previousChangePct =
        previousActual > 0
          ? Math.round(((actual - previousActual) / previousActual) * 1000) / 10
          : null;
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
      previousActual,
      previousChangePct,
      pctOfIncome,
      incomeForPeriod,
    };
  },
};
