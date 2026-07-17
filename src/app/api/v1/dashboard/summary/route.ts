import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { prisma } from '@/lib/db/prisma';
import { FundsService } from '@/modules/funds';
import { NetWorthRepository } from '@/modules/net-worth/net-worth.repository';

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

// ATM_WITHDRAWAL is deliberately excluded — it's a cash movement, not spend. Counting it
// here would double the real expense once cash is actually paid out (also excluded in
// reports/kpi and cashflow-report for the same reason).
const OUTFLOW_TYPES = ['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT'] as const;
const INFLOW_TYPES = ['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT', 'REFUND'] as const;

// Deliberately uncached: this always reads live from the DB. A time-based cache here
// previously let the dashboard show pre-edit totals for up to 30s after any transaction
// write, visibly disagreeing with the (uncached) Transactions page. Client-side React
// Query staleTime already avoids redundant refetches on the happy path.
async function fetchSummaryData(userId: string, year: number, month: number) {
  const [user, outAgg, inAgg, totalCount, pendingCount, nwAccounts, fundsSummary] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),

      // status: VOID must be excluded here — this is the one figure users compare
      // directly against the Transactions page's own total (getPeriodSummary, via
      // TransactionRepository.sumByTypeForPeriod), which already excludes VOID rows.
      // Without this filter a voided expense/investment/sinking-deposit this month
      // would inflate "Month spend" here while the Transactions page correctly omits it.
      prisma.financeTransaction.aggregate({
        where: {
          userId,
          budgetPeriodYear: year,
          budgetPeriodMonth: month,
          type: { in: OUTFLOW_TYPES as never },
          status: { not: 'VOID' },
        },
        _sum: { amount: true },
      }),

      prisma.financeTransaction.aggregate({
        where: {
          userId,
          budgetPeriodYear: year,
          budgetPeriodMonth: month,
          type: { in: INFLOW_TYPES as never },
          status: { not: 'VOID' },
        },
        _sum: { amount: true },
      }),

      prisma.financeTransaction.count({ where: { userId } }),
      prisma.financeTransaction.count({ where: { userId, status: 'PENDING' } }),
      NetWorthRepository.findAccountsWithGroups(userId),
      FundsService.getSummary(userId),
    ]);

  return { user, outAgg, inAgg, totalCount, pendingCount, nwAccounts, fundsSummary };
}

const handleSummary = compose(withAuth())(async (_req, ctx) => {
  const userId = ctx.session!.id;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const { user, outAgg, inAgg, totalCount, pendingCount, nwAccounts, fundsSummary } =
      await fetchSummaryData(userId, year, month);

    // Compute net worth from account balances
    let totalAssets = 0;
    let totalLiabilities = 0;
    for (const acc of nwAccounts) {
      if (acc.isExcludeNetWorth) continue;
      if (acc.group.type === 'ASSET') totalAssets += acc.balance;
      else totalLiabilities += acc.balance;
    }
    const netWorth = totalAssets - totalLiabilities;

    const totalOut = outAgg._sum.amount ?? 0;
    const totalIn = inAgg._sum.amount ?? 0;

    const dayOfMonth = now.getDate();
    const totalDays = daysInMonth(year, month);
    const daysUntilClose = totalDays - dayOfMonth;
    const spendPace = dayOfMonth > 0 ? Math.round(totalOut / dayOfMonth) : 0;

    const MONTH_LABELS = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const monthLabel = MONTH_LABELS[month - 1];
    const budgetPeriodLabel = `${monthLabel} ${year}`;
    const closeDateLabel = `${monthLabel} ${totalDays}`;
    const monthClosesLabel = `${daysUntilClose} days · ${closeDateLabel}`;
    const spendPaceLabel = `Pace: ₹${spendPace.toLocaleString('en-IN')}/day`;

    return v1Ok({
      // Real data
      userInitials: initials(user.name ?? ''),
      transactionCount: totalCount,
      totalOut,
      totalIn,
      monthSpend: totalOut,
      pendingCount,
      budgetPeriodLabel,
      daysUntilClose,
      closeDateLabel,
      monthClosesLabel,
      spendPace,
      spendPaceLabel,
      notificationCount: pendingCount, // pending txns drive the badge until we have a real notifications system

      netWorth,
      netWorthChangePct: 0,
      readyToAssign: fundsSummary.totalUnallocated,
      unallocated: fundsSummary.totalUnallocated,
      assigned: fundsSummary.totalAllocated,
      remaining: 0,
      spendPaceChangePct: 0,
      nextRecurringLabel: '—',
      market: {},
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleSummary);
