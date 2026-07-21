import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { prisma } from '@/lib/db/prisma';
import { FundsService } from '@/modules/funds';
import { NetWorthRepository } from '@/modules/net-worth/net-worth.repository';
import { getPeriodTotals } from '@/modules/transactions/period-spend';

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

// Deliberately uncached: this always reads live from the DB. A time-based cache here
// previously let the dashboard show pre-edit totals for up to 30s after any transaction
// write, visibly disagreeing with the (uncached) Transactions page. Client-side React
// Query staleTime already avoids redundant refetches on the happy path.
async function fetchSummaryData(userId: string, year: number, month: number) {
  const [user, periodTotals, totalCount, pendingCount, nwAccounts, fundsSummary] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),

      // Same figure the Transactions page and Calendar widget read — see period-spend.ts.
      getPeriodTotals(userId, year, month),

      prisma.financeTransaction.count({ where: { userId } }),
      prisma.financeTransaction.count({ where: { userId, status: 'PENDING' } }),
      NetWorthRepository.findAccountsWithGroups(userId),
      FundsService.getSummary(userId),
    ]);

  return { user, periodTotals, totalCount, pendingCount, nwAccounts, fundsSummary };
}

const handleSummary = compose(withAuth())(async (_req, ctx) => {
  const userId = ctx.session!.id;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  try {
    const { user, periodTotals, totalCount, pendingCount, nwAccounts, fundsSummary } =
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

    const totalOut = periodTotals.totalExpense;
    const totalIn = periodTotals.totalIncome;

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
      hasAccounts: nwAccounts.length > 0,
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
