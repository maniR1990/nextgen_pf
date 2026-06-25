import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1Ok, v1FromApiError } from '@/lib/api/v1/envelope';
import { prisma } from '@/lib/db/prisma';

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

const OUTFLOW_TYPES = ['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT', 'ATM_WITHDRAWAL'] as const;
const INFLOW_TYPES  = ['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT', 'REFUND']         as const;

const handleSummary = compose(withAuth())(async (_req, ctx) => {
  const userId = ctx.session!.id;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based

  try {
    const [user, outAgg, inAgg, totalCount, pendingCount] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } }),

      prisma.financeTransaction.aggregate({
        where: { userId, budgetPeriodYear: year, budgetPeriodMonth: month, type: { in: OUTFLOW_TYPES as never } },
        _sum: { amount: true },
      }),

      prisma.financeTransaction.aggregate({
        where: { userId, budgetPeriodYear: year, budgetPeriodMonth: month, type: { in: INFLOW_TYPES as never } },
        _sum: { amount: true },
      }),

      prisma.financeTransaction.count({ where: { userId } }),

      prisma.financeTransaction.count({ where: { userId, status: 'PENDING' } }),
    ]);

    const totalOut = outAgg._sum.amount ?? 0;
    const totalIn  = inAgg._sum.amount  ?? 0;

    const dayOfMonth     = now.getDate();
    const totalDays      = daysInMonth(year, month);
    const daysUntilClose = totalDays - dayOfMonth;
    const spendPace      = dayOfMonth > 0 ? Math.round(totalOut / dayOfMonth) : 0;

    const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthLabel = MONTH_LABELS[month - 1];
    const budgetPeriodLabel = `${monthLabel} ${year}`;
    const closeDateLabel    = `${monthLabel} ${totalDays}`;
    const monthClosesLabel  = `${daysUntilClose} days · ${closeDateLabel}`;
    const spendPaceLabel    = `Pace: ₹${spendPace.toLocaleString('en-IN')}/day`;

    return v1Ok({
      // Real data
      userInitials:      initials(user.name ?? ''),
      transactionCount:  totalCount,
      totalOut,
      totalIn,
      monthSpend:        totalOut,
      pendingCount,
      budgetPeriodLabel,
      daysUntilClose,
      closeDateLabel,
      monthClosesLabel,
      spendPace,
      spendPaceLabel,
      notificationCount: pendingCount, // pending txns drive the badge until we have a real notifications system

      // Budget fields — not yet computed (no payment sources / budget engine wired)
      netWorth:            0,
      netWorthChangePct:   0,
      readyToAssign:       0,
      unallocated:         0,
      assigned:            0,
      remaining:           0,
      spendPaceChangePct:  0,
      nextRecurringLabel:  '—',
      market:              {},
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleSummary);
