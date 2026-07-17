import { getPeriodTotals } from '@/modules/transactions/period-spend';
import { CashflowReportRepository } from './cashflow-report.repository';
import type {
  CashflowReportData,
  FundGroupContributionResult,
  FundGroupLineItem,
} from './cashflow-report.types';

function safePct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export const CashflowReportService = {
  async getMonthlyReport(userId: string, year: number, month: number): Promise<CashflowReportData> {
    const [periodTotals, savingsRaw, fundUsedRaw] = await Promise.all([
      // Same shared figures every other dashboard/transactions/budget view reads — see
      // period-spend.ts. Previously this report ran its own three aggregate queries with
      // no VOID-status filter, silently over-counting a voided transaction.
      getPeriodTotals(userId, year, month),
      CashflowReportRepository.fundGroupBreakdown(userId, year, month, 'IN'),
      CashflowReportRepository.fundGroupBreakdown(userId, year, month, 'OUT'),
    ]);

    const totalIncome = periodTotals.totalIncome;
    const expensesTotal = periodTotals.totalExpenseOnly;
    const atmTotal = periodTotals.totalsByType.ATM_WITHDRAWAL ?? 0;

    const totalSavings = savingsRaw.reduce((s, r) => s + r.totalAmount, 0);
    const totalFundUsed = fundUsedRaw.reduce((s, r) => s + r.totalAmount, 0);

    // denominator = income + fund used (handles zero-income withdrawal months)
    const denominator = totalIncome + totalFundUsed;

    const remaining = denominator - totalSavings - expensesTotal - atmTotal;

    const savingsPct = safePct(totalSavings, denominator);
    const expensesPct = safePct(expensesTotal, denominator);
    const remainingPct = safePct(remaining, denominator);

    const toLineItem = (
      r: { fundGroupId: string; fundGroupName: string; totalAmount: number },
      denom: number,
    ): FundGroupLineItem => ({
      fundGroupId: r.fundGroupId,
      fundGroupName: r.fundGroupName,
      fundGroupColor: null,
      totalAmount: r.totalAmount,
      pct: safePct(r.totalAmount, denom),
    });

    return {
      year,
      month,
      totalIncome,
      incomeSourceLabel: totalIncome > 0 ? 'Salary' : '—',
      totalSavings,
      savingsBreakdown: savingsRaw.map((r) => toLineItem(r, denominator)),
      savingsPct,
      totalFundUsed,
      fundUsed: fundUsedRaw.map((r) => toLineItem(r, denominator)),
      expensesTotal,
      expensesPct,
      remaining,
      remainingPct,
      denominator,
    };
  },

  async getFundGroupLifetimeContribution(
    userId: string,
    fundGroupId: string,
    targetAmount?: number,
  ): Promise<FundGroupContributionResult> {
    const { totalIn, totalOut } = await CashflowReportRepository.lifetimeContribution(
      userId,
      fundGroupId,
    );
    const netContributed = totalIn - totalOut;

    let progressPct: number | null = null;
    if (targetAmount && targetAmount > 0) {
      progressPct = Math.min(100, Math.round((netContributed / targetAmount) * 1000) / 10);
    }

    return { netContributed, progressPct };
  },
};
