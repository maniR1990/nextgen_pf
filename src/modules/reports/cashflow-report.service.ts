import { CashflowReportRepository } from './cashflow-report.repository';
import type { CashflowReportData, FundGroupContributionResult, FundGroupLineItem } from './cashflow-report.types';

const INCOME_TYPES  = ['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT', 'REFUND'] as const;
const EXPENSE_TYPES = ['EXPENSE'] as const;
const ATM_TYPES     = ['ATM_WITHDRAWAL'] as const;

function safePct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export const CashflowReportService = {
  async getMonthlyReport(userId: string, year: number, month: number): Promise<CashflowReportData> {
    const [totalIncome, expensesTotal, atmTotal, savingsRaw, fundUsedRaw] = await Promise.all([
      CashflowReportRepository.sumByTypes(userId, year, month, INCOME_TYPES),
      CashflowReportRepository.sumByTypes(userId, year, month, EXPENSE_TYPES),
      CashflowReportRepository.sumByTypes(userId, year, month, ATM_TYPES),
      CashflowReportRepository.fundGroupBreakdown(userId, year, month, 'IN'),
      CashflowReportRepository.fundGroupBreakdown(userId, year, month, 'OUT'),
    ]);

    const totalSavings = savingsRaw.reduce((s, r) => s + r.totalAmount, 0);
    const totalFundUsed = fundUsedRaw.reduce((s, r) => s + r.totalAmount, 0);

    // denominator = income + fund used (handles zero-income withdrawal months)
    const denominator = totalIncome + totalFundUsed;

    const remaining = denominator - totalSavings - expensesTotal - atmTotal;

    const savingsPct = safePct(totalSavings, denominator);
    const expensesPct = safePct(expensesTotal, denominator);
    const remainingPct = safePct(remaining, denominator);

    const toLineItem = (r: { fundGroupId: string; fundGroupName: string; totalAmount: number }, denom: number): FundGroupLineItem => ({
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
    const { totalIn, totalOut } = await CashflowReportRepository.lifetimeContribution(userId, fundGroupId);
    const netContributed = totalIn - totalOut;

    let progressPct: number | null = null;
    if (targetAmount && targetAmount > 0) {
      progressPct = Math.min(100, Math.round((netContributed / targetAmount) * 1000) / 10);
    }

    return { netContributed, progressPct };
  },
};
