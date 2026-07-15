import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { BudgetEngineService } from '@/modules/budget-engine';
import { TransactionRepository } from '@/modules/transactions';
import { derivePayments } from '@/components/common/PaymentSchedulePanel/derivePayments';
import { unstable_cache } from 'next/cache';
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

const fetchCalendarData = unstable_cache(
  async (userId: string, year: number, month: number) => {
    const [transactions, budgetSummary] = await Promise.all([
      TransactionRepository.findAllForPeriod(userId, year, month),
      BudgetEngineService.getMonthlySummary(userId, year, month),
    ]);
    return { transactions, budgetSummary };
  },
  ['dashboard-calendar'],
  { revalidate: 30 },
);

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
    const { transactions: rawTransactions, budgetSummary } = await fetchCalendarData(
      userId,
      year,
      month,
    );
    // unstable_cache round-trips its return value through JSON between requests, which
    // turns Date objects into plain strings on a cache hit (a cache miss still has real
    // Dates fresh from Prisma) — re-wrap so every consumer below sees a real Date either way.
    const transactions = rawTransactions.map((tx) => ({ ...tx, date: new Date(tx.date) }));

    const expenseDaySet = new Set<number>();
    const incomeDaySet = new Set<number>();
    for (const tx of transactions) {
      const day = tx.date.getUTCDate();
      if ((SPEND_TYPES as readonly string[]).includes(tx.type)) expenseDaySet.add(day);
      else if ((INCOME_TYPES as readonly string[]).includes(tx.type)) incomeDaySet.add(day);
    }

    const duePayments = derivePayments(budgetSummary.groups).map((p) => ({
      dueDay: p.dueDay,
      name: p.name,
      amount: p.amount,
      paid: p.paid,
    }));

    let plannedTotal = 0;
    let actualTotal = 0;
    for (const group of budgetSummary.groups) {
      if (group.type !== 'EXPENSE') continue;
      plannedTotal += group.planned;
      actualTotal += group.actual;
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
