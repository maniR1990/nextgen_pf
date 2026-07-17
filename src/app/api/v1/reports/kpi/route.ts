import { compose, withAuth } from '@/lib/api/middleware';
import { asRouteHandler } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { prisma } from '@/lib/db/prisma';
import { BudgetEngineService } from '@/modules/budget-engine';
import { getPeriodTotals, INFLOW_TYPES, OUTFLOW_TYPES } from '@/modules/transactions/period-spend';

// The investment-only slice of OUTFLOW_TYPES — everything debit except day-to-day
// EXPENSE. Derived rather than hand-typed so it can't drift from OUTFLOW_TYPES itself.
const INVEST_TYPES = OUTFLOW_TYPES.filter((t) => t !== 'EXPENSE');

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
    const [periodTotals, sipCount, budgetSummary] = await Promise.all([
      // Same shared figures every other dashboard/transactions/budget view reads — see
      // period-spend.ts. Previously this route ran four of its own aggregate queries
      // plus a groupBy, none filtering out VOID transactions.
      getPeriodTotals(userId, year, month),
      // Count recurring investment transactions (SIPs)
      prisma.financeTransaction.count({
        where: {
          userId,
          budgetPeriodYear: year,
          budgetPeriodMonth: month,
          type: { in: INVEST_TYPES as never },
          isRecurring: true,
          status: { not: 'VOID' },
        },
      }),
      BudgetEngineService.getMonthlySummary(userId, year, month),
    ]);

    const totalIncome = periodTotals.totalIncome;
    const expensesSpent = periodTotals.totalExpenseOnly;
    const invested = INVEST_TYPES.reduce(
      (sum, type) => sum + (periodTotals.totalsByType[type] ?? 0),
      0,
    );
    const atmWithdrawn = periodTotals.totalsByType.ATM_WITHDRAWAL ?? 0;
    const accountBalance = totalIncome - expensesSpent - invested - atmWithdrawn;

    // "Salary + Gift" etc. — built from totalsByType instead of a separate groupBy
    // query. INFLOW_TYPES' order already puts INCOME first (it mirrors TX_TYPE_META's
    // declaration order in period-spend.ts), so no separate sort/ORDER array is needed.
    const incomeSourceLabel =
      INFLOW_TYPES.filter((type) => (periodTotals.totalsByType[type] ?? 0) > 0)
        .map((type) => INCOME_TYPE_LABELS[type] ?? type)
        .join(' + ') || '—';

    // Budget totals from budget engine (planned vs spent across all categories)
    const expensesBudget = (budgetSummary.groups ?? [])
      .filter((g) => g.type === 'EXPENSE')
      .reduce((sum, g) => sum + g.planned, 0);
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
