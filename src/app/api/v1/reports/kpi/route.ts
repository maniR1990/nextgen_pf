import { compose, withAuth } from '@/lib/api/middleware';
import { asRouteHandler } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { prisma } from '@/lib/db/prisma';
import { BudgetEngineService } from '@/modules/budget-engine';

const INCOME_TYPES = ['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT', 'REFUND'] as const;
const EXPENSE_TYPES = ['EXPENSE'] as const;
const INVEST_TYPES = ['INVESTMENT', 'SINKING_DEPOSIT'] as const;
const ATM_TYPES = ['ATM_WITHDRAWAL'] as const;

const INCOME_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Salary',
  GIFT_RECEIVED: 'Gift',
  REIMBURSEMENT: 'Reimbursement',
  REFUND: 'Refund',
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

const handleReportsKpi = compose(withAuth())(async (req, ctx) => {
  const userId = ctx.session!.id;
  const url = new URL(req.url);
  const now = new Date();

  const year = Number.parseInt(url.searchParams.get('year') ?? String(now.getFullYear()), 10);
  const month = Number.parseInt(url.searchParams.get('month') ?? String(now.getMonth() + 1), 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12 || year < 2020) {
    return v1FromApiError({ message: 'Invalid year or month', status: 400, code: 'BAD_REQUEST' });
  }

  try {
    const [incomeAgg, expenseAgg, investAgg, atmAgg, incomeGroups, sipCount, budgetSummary] =
      await Promise.all([
        prisma.financeTransaction.aggregate({
          where: {
            userId,
            budgetPeriodYear: year,
            budgetPeriodMonth: month,
            type: { in: INCOME_TYPES as never },
          },
          _sum: { amount: true },
        }),
        prisma.financeTransaction.aggregate({
          where: {
            userId,
            budgetPeriodYear: year,
            budgetPeriodMonth: month,
            type: { in: EXPENSE_TYPES as never },
          },
          _sum: { amount: true },
        }),
        prisma.financeTransaction.aggregate({
          where: {
            userId,
            budgetPeriodYear: year,
            budgetPeriodMonth: month,
            type: { in: INVEST_TYPES as never },
          },
          _sum: { amount: true },
        }),
        prisma.financeTransaction.aggregate({
          where: {
            userId,
            budgetPeriodYear: year,
            budgetPeriodMonth: month,
            type: { in: ATM_TYPES as never },
          },
          _sum: { amount: true },
        }),
        // Distinct income types to build a label like "Salary + Gift"
        prisma.financeTransaction.groupBy({
          by: ['type'],
          where: {
            userId,
            budgetPeriodYear: year,
            budgetPeriodMonth: month,
            type: { in: INCOME_TYPES as never },
          },
        }),
        // Count recurring investment transactions (SIPs)
        prisma.financeTransaction.count({
          where: {
            userId,
            budgetPeriodYear: year,
            budgetPeriodMonth: month,
            type: { in: INVEST_TYPES as never },
            isRecurring: true,
          },
        }),
        BudgetEngineService.getMonthlySummary(userId, year, month),
      ]);

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const expensesSpent = expenseAgg._sum.amount ?? 0;
    const invested = investAgg._sum.amount ?? 0;
    const atmWithdrawn = atmAgg._sum.amount ?? 0;
    const accountBalance = totalIncome - expensesSpent - invested - atmWithdrawn;

    // "Salary + Gift" etc. — sorted to keep INCOME first
    const ORDER = ['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT', 'REFUND'];
    const incomeSourceLabel =
      incomeGroups
        .sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type))
        .map((row) => INCOME_TYPE_LABELS[row.type] ?? row.type)
        .join(' + ') || '—';

    // Budget totals from budget engine (planned vs spent across all categories)
    const expensesBudget = budgetSummary.totals.totalPlanned;
    const expensesPct =
      expensesBudget > 0 ? Math.round((expensesSpent / expensesBudget) * 1000) / 10 : 0;
    const expensesVariant: 'success' | 'warning' | 'error' =
      expensesPct >= 100 ? 'error' : expensesPct >= 80 ? 'warning' : 'success';

    const budgetRemaining = expensesBudget - expensesSpent;

    // Days left: only meaningful for the current period
    const totalDays = daysInMonth(year, month);
    const isCurrentPeriod = year === now.getFullYear() && month === now.getMonth() + 1;
    const daysLeft = isCurrentPeriod ? Math.max(0, totalDays - now.getDate()) : 0;

    // SIP count label
    const investedLabel = sipCount > 0 ? `${sipCount} SIP${sipCount !== 1 ? 's' : ''}` : '—';

    // Balance status
    const balancePct = totalIncome > 0 ? accountBalance / totalIncome : 0;
    const balanceVariant: 'success' | 'warning' | 'error' =
      accountBalance <= 0 ? 'error' : balancePct < 0.15 ? 'warning' : 'success';
    const balanceStatus =
      accountBalance <= 0
        ? 'Deficit'
        : balancePct < 0.15
          ? 'Low buffer'
          : balancePct < 0.4
            ? 'Moderate buffer'
            : 'Healthy buffer';

    return v1Ok({
      totalIncomeMinor: toPaise(totalIncome),
      incomeSourceLabel,
      expensesSpentMinor: toPaise(expensesSpent),
      expensesBudgetMinor: toPaise(expensesBudget),
      expensesPct,
      expensesVariant,
      investedMinor: toPaise(invested),
      investedLabel,
      budgetRemainingMinor: toPaise(budgetRemaining),
      daysLeft,
      accountBalanceMinor: toPaise(accountBalance),
      balanceStatus,
      balanceVariant,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleReportsKpi);
