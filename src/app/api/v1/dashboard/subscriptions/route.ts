import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { dueAmountFromMonthly } from '@/lib/utils/recurringFrequency';
import { BudgetEngineRepository, BudgetEngineService } from '@/modules/budget-engine';
import { collectLeaves } from '@/modules/budget-engine/lib/collectLeaves';
import { getPeriodTotals } from '@/modules/transactions/period-spend';
import type { RecurringFrequency } from '@prisma/client';
import { deriveSubscriptionData } from './derive';
import type { RecurringTxInput, SubscriptionTemplateInput } from './derive';

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function ymd(year: number, month: number, day: number): string {
  const clamped = Math.min(day, daysInMonth(year, month));
  return `${year}-${String(month).padStart(2, '0')}-${String(clamped).padStart(2, '0')}`;
}

function ymdDate(year: number, month: number, day: number): Date {
  const clamped = Math.min(day, daysInMonth(year, month));
  return new Date(year, month - 1, clamped);
}

// Deliberately uncached: this always reads live from the DB. A time-based cache here
// previously let the dashboard show pre-edit totals for up to 60s after any transaction
// write, visibly disagreeing with the (uncached) Transactions page. Client-side React
// Query staleTime already avoids redundant refetches on the happy path.
//
// Sourced from Budget.isRecurring — the same per-category recurring flag/frequency/
// due-day the Budget page itself edits — rather than the separate RecurringTemplate
// model this widget used to read. RecurringTemplate has its own dedicated CRUD surface
// (/dashboard/recurring) that nothing here writes to; reading it left this widget
// permanently empty for anyone who only ever used Budget's own "Mark as recurring"
// toggle, which is every real user of this app so far. A category's Budget row only
// exists in a given period when it's actually due (see BudgetEngineService's recurring
// seeding), so "isRecurring leaves in this period's summary" already means "due this
// cycle" — no extra due-month filtering needed here.
//
// isRecurring alone is too broad to mean "subscription/bill worth watching": in
// practice it's also used as a general "this is part of my normal monthly budget" flag
// on plain categories (groceries, haircuts, etc.) that have no specific date to track.
// A due day is only ever set on the handful of categories that are genuinely billed on
// a schedule — that's the signal this widget actually needs, so it requires both flags
// rather than isRecurring on its own.
async function fetchSubscriptionData(userId: string, year: number, month: number) {
  const [summary, periodTotals] = await Promise.all([
    BudgetEngineService.getMonthlySummary(userId, year, month),
    getPeriodTotals(userId, year, month),
  ]);

  const leaves = summary.groups
    .filter((g) => g.type === 'EXPENSE')
    .flatMap((g) => collectLeaves(g.categories));
  const recurring = leaves.filter(({ node }) => node.isRecurring && node.dueDay != null);

  const categoryIds = recurring.map(({ node }) => node.id);
  const previousPlans = await BudgetEngineRepository.findPreviousRecurringPlans(
    userId,
    categoryIds,
    year,
    month,
  );

  // Different items can have different "previous due" periods (a half-yearly bill's
  // last occurrence isn't "last month"), so batch one spend query per distinct period
  // instead of one per category.
  const categoryIdsByPeriod = new Map<string, string[]>();
  for (const [categoryId, prev] of previousPlans) {
    const key = `${prev.year}-${prev.month}`;
    const list = categoryIdsByPeriod.get(key);
    if (list) list.push(categoryId);
    else categoryIdsByPeriod.set(key, [categoryId]);
  }
  const previousSpendMap = new Map<string, number>();
  await Promise.all(
    [...categoryIdsByPeriod.entries()].map(async ([key, ids]) => {
      const [y, m] = key.split('-').map(Number);
      const rows = await BudgetEngineRepository.findSpendByCategory(userId, ids, y, m);
      for (const row of rows) {
        if (row.categoryId) previousSpendMap.set(row.categoryId, row._sum.amount ?? 0);
      }
    }),
  );

  const templates: SubscriptionTemplateInput[] = recurring.map(({ node, parentName }) => {
    const frequency = (node.frequency as RecurringFrequency | null) ?? 'MONTHLY';
    return {
      id: node.id,
      name: node.name,
      frequency,
      // estimatedAmount is per-occurrence; node.planned is already the monthly-
      // equivalent Budget stores (see the due-amount editor on the Budget page), so
      // convert it back — deriveSubscriptionData re-derives the monthly figure from
      // this via the same shared conversion table, keeping the two views from drifting.
      estimatedAmount: Math.round(dueAmountFromMonthly(node.planned, frequency)),
      nextRenewal: ymd(year, month, node.dueDay ?? 1),
      categoryName: parentName,
      accountName: null,
    };
  });

  const transactions: RecurringTxInput[] = [];
  for (const { node } of recurring) {
    const prev = previousPlans.get(node.id);
    const prevActual = prev ? (previousSpendMap.get(node.id) ?? 0) : 0;
    // Only added as a pair: a lone "previous" entry with no current charge would be
    // mistaken for the *current* one by deriveSubscriptionData's latest/previous
    // pairing, misreporting an unpaid cycle as if it were already settled at last
    // cycle's amount.
    if (node.actual > 0 && prev && prevActual > 0) {
      transactions.push({
        recurringTemplateId: node.id,
        amount: prevActual,
        date: ymdDate(prev.year, prev.month, node.dueDay ?? 1),
      });
      transactions.push({
        recurringTemplateId: node.id,
        amount: node.actual,
        date: ymdDate(year, month, node.dueDay ?? 1),
      });
    }
  }

  return { templates, transactions, monthlyExpenseTotal: periodTotals.totalExpenseOnly };
}

const handleSubscriptions = compose(withAuth())(async (_req, ctx) => {
  const userId = ctx.session!.id;

  try {
    const now = new Date();
    const { templates, transactions, monthlyExpenseTotal } = await fetchSubscriptionData(
      userId,
      now.getFullYear(),
      now.getMonth() + 1,
    );

    const data = deriveSubscriptionData({ templates, transactions, monthlyExpenseTotal });

    // Budget plans carry no account association (only a category) — an "Unassigned"
    // bucket here would be noise, not a real breakdown, so this dimension is dropped
    // rather than shown empty-but-misleading.
    return v1Ok({ ...data, byAccount: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleSubscriptions);
