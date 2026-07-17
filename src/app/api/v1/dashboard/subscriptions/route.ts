import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { RecurringTemplatesRepository } from '@/modules/recurring-templates';
import { computeOccurrences } from '@/modules/recurring-templates/recurring-templates.service';
import { TransactionRepository } from '@/modules/transactions';
import { getPeriodTotals } from '@/modules/transactions/period-spend';
import { deriveSubscriptionData } from './derive';
import type { RecurringTxInput, SubscriptionTemplateInput } from './derive';

// Deliberately uncached: this always reads live from the DB. A time-based cache here
// previously let the dashboard show pre-edit totals for up to 60s after any transaction
// write, visibly disagreeing with the (uncached) Transactions page. Client-side React
// Query staleTime already avoids redundant refetches on the happy path.
async function fetchSubscriptionData(userId: string) {
  const now = new Date();
  const [templates, history, periodTotals] = await Promise.all([
    RecurringTemplatesRepository.findByUserId(userId),
    TransactionRepository.findRecurringHistory(userId),
    // Same shared figure every other dashboard/transactions view reads — see period-spend.ts.
    getPeriodTotals(userId, now.getFullYear(), now.getMonth() + 1),
  ]);
  return { templates, history, periodTotals };
}

const handleSubscriptions = compose(withAuth())(async (_req, ctx) => {
  const userId = ctx.session!.id;

  try {
    const { templates: rawTemplates, history, periodTotals } =
      await fetchSubscriptionData(userId);
    const now = new Date();

    const activeExpenseTemplates = rawTemplates.filter((t) => t.isActive && t.type === 'EXPENSE');

    const templates: SubscriptionTemplateInput[] = activeExpenseTemplates.map((t) => {
      const [nextOccurrence] = computeOccurrences(t, 1, now);
      return {
        id: t.id,
        name: t.name,
        frequency: t.frequency,
        estimatedAmount: t.estimatedAmount,
        nextRenewal: (nextOccurrence ?? now).toISOString().slice(0, 10),
        categoryName: t.category?.name ?? null,
        accountName: t.account?.name ?? null,
      };
    });

    const templateIds = new Set(templates.map((t) => t.id));
    const transactions: RecurringTxInput[] = history
      .filter(
        (tx): tx is typeof tx & { recurringTemplateId: string } =>
          tx.recurringTemplateId != null && templateIds.has(tx.recurringTemplateId),
      )
      .map((tx) => ({
        recurringTemplateId: tx.recurringTemplateId,
        amount: tx.amount,
        date: tx.date,
      }));

    const monthlyExpenseTotal = periodTotals.totalExpenseOnly;

    const data = deriveSubscriptionData({ templates, transactions, monthlyExpenseTotal });

    return v1Ok(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleSubscriptions);
