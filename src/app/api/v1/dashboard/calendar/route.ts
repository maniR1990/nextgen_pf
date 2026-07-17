import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { BudgetEngineService } from '@/modules/budget-engine';
import { TransactionRepository } from '@/modules/transactions';
import { derivePayments } from '@/components/common/PaymentSchedulePanel/derivePayments';
import { deriveCalendarData } from './derive';

// Only EXPENSE counts toward "no-spend day" and the budget-pace total — deliberately
// narrower than the dashboard summary's OUTFLOW_TYPES (EXPENSE + INVESTMENT +
// SINKING_DEPOSIT), which answers a different question (overall cash outflow pace).
// A day where you only moved money into savings or investments isn't a "spend" day in
// the behavioral no-spend-streak sense this widget is tracking.
const SPEND_TYPES = ['EXPENSE'] as const;
const INCOME_TYPES = ['INCOME'] as const;

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// Deliberately uncached: this always reads live from the DB. A time-based cache here
// previously let the dashboard show pre-edit totals for up to 30s after any transaction
// write, visibly disagreeing with the (uncached) Transactions page. Client-side React
// Query staleTime already avoids redundant refetches on the happy path.
async function fetchCalendarData(userId: string, year: number, month: number) {
  const [transactions, budgetSummary] = await Promise.all([
    TransactionRepository.findAllForPeriod(userId, year, month),
    BudgetEngineService.getMonthlySummary(userId, year, month),
  ]);
  return { transactions, budgetSummary };
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
    const { transactions, budgetSummary } = await fetchCalendarData(userId, year, month);

    const expenseDaySet = new Set<number>();
    const incomeDaySet = new Set<number>();
    // actualTotal is summed directly from transactions (same SPEND_TYPES filter as
    // expenseDaySet above), not from BudgetEngineService's per-category "actual" —
    // that figure groups spend by categoryId and silently drops any transaction with
    // no category, understating real spend for anyone with even one uncategorized
    // expense. Transaction-level EXPENSE totals are the one figure every other
    // dashboard/transactions view already agrees on; this keeps budget pace on it too.
    let actualTotal = 0;
    for (const tx of transactions) {
      const day = tx.date.getUTCDate();
      if ((SPEND_TYPES as readonly string[]).includes(tx.type)) {
        expenseDaySet.add(day);
        actualTotal += tx.amount;
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
