import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { BudgetEngineService } from '@/modules/budget-engine';
import { TransactionRepository } from '@/modules/transactions';
import { getPeriodTotals, SPEND_ONLY_TYPES } from '@/modules/transactions/period-spend';
import { derivePayments } from '@/components/common/PaymentSchedulePanel/derivePayments';
import { deriveCalendarData } from './derive';

// The per-day EXPENSE/INCOME split below is calendar-specific (which day had activity),
// separate from the period-wide totals — see period-spend.ts for those.
const INCOME_TYPES = ['INCOME'] as const;

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// Deliberately uncached: this always reads live from the DB. A time-based cache here
// previously let the dashboard show pre-edit totals for up to 30s after any transaction
// write, visibly disagreeing with the (uncached) Transactions page. Client-side React
// Query staleTime already avoids redundant refetches on the happy path.
async function fetchCalendarData(userId: string, year: number, month: number) {
  const [transactions, budgetSummary, periodTotals] = await Promise.all([
    TransactionRepository.findAllForPeriod(userId, year, month),
    BudgetEngineService.getMonthlySummary(userId, year, month),
    // Same shared figure the Dashboard summary and Transactions page read — see
    // period-spend.ts. Deliberately not derived from `transactions` above: that keeps
    // this route's total on the exact same code path as every other view instead of a
    // locally re-implemented sum that could quietly diverge again.
    getPeriodTotals(userId, year, month),
  ]);
  return { transactions, budgetSummary, periodTotals };
}

const handleCalendar = compose(withAuth())(async (req, ctx) => {
  const userId = ctx.session!.id;
  const url = new URL(req.url);
  const now = new Date();

  const year = Number.parseInt(url.searchParams.get('year') ?? String(now.getFullYear()), 10);
  const month = Number.parseInt(url.searchParams.get('month') ?? String(now.getMonth() + 1), 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12 || year < 2020) {
    return v1FromApiError({ message: 'Invalid year or month', status: 400, code: 'BAD_REQUEST' });
  }

  try {
    const { transactions, budgetSummary, periodTotals } = await fetchCalendarData(
      userId,
      year,
      month,
    );
    const actualTotal = periodTotals.totalExpenseOnly;

    const expenseDaySet = new Set<number>();
    const incomeDaySet = new Set<number>();
    for (const tx of transactions) {
      const day = tx.date.getUTCDate();
      if ((SPEND_ONLY_TYPES as readonly string[]).includes(tx.type)) {
        expenseDaySet.add(day);
      } else if ((INCOME_TYPES as readonly string[]).includes(tx.type)) {
        incomeDaySet.add(day);
      }
    }

    const duePayments = derivePayments(budgetSummary.groups).map((p) => ({
      dueDay: p.dueDay,
      name: p.name,
      amount: p.amount,
      paid: p.paid,
    }));

    // plannedTotal stays category-based — a "planned" amount is inherently something
    // the user set per budget category, so uncategorized spend has no planned figure
    // to contribute regardless.
    let plannedTotal = 0;
    for (const group of budgetSummary.groups) {
      if (group.type !== 'EXPENSE') continue;
      plannedTotal += group.planned;
    }

    const totalDays = daysInMonth(year, month);
    const nowKey = now.getFullYear() * 12 + (now.getMonth() + 1);
    const reqKey = year * 12 + month;
    const dayOfMonth = reqKey === nowKey ? now.getDate() : reqKey < nowKey ? totalDays : 0;

    const data = deriveCalendarData({
      dayOfMonth,
      totalDays,
      expenseDays: [...expenseDaySet],
      incomeDays: [...incomeDaySet],
      duePayments,
      plannedTotal,
      actualTotal,
    });

    const txList = transactions.map((tx) => ({
      id: tx.id,
      date: tx.date.toISOString().slice(0, 10),
      type: tx.type,
      amount: tx.amount,
      merchant: tx.merchant,
      categoryName: tx.category?.name ?? null,
    }));

    return v1Ok({ year, month, ...data, transactions: txList });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleCalendar);
