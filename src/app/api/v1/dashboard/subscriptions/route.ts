import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { RecurringTemplatesRepository } from '@/modules/recurring-templates';
import { computeOccurrences } from '@/modules/recurring-templates/recurring-templates.service';
import { TransactionRepository } from '@/modules/transactions';
import { unstable_cache } from 'next/cache';
import { deriveSubscriptionData } from './derive';
import type { RecurringTxInput, SubscriptionTemplateInput } from './derive';

const fetchSubscriptionData = unstable_cache(
  async (userId: string) => {
    const now = new Date();
    const [templates, history, typeSums] = await Promise.all([
      RecurringTemplatesRepository.findByUserId(userId),
      TransactionRepository.findRecurringHistory(userId),
      TransactionRepository.sumByTypeForPeriod(userId, now.getFullYear(), now.getMonth() + 1),
    ]);
    return { templates, history, typeSums };
  },
  ['dashboard-subscriptions'],
  { revalidate: 60 },
);

const handleSubscriptions = compose(withAuth())(async (_req, ctx) => {
  const userId = ctx.session!.id;

  try {
    const { templates: rawTemplates, history: rawHistory, typeSums } =
      await fetchSubscriptionData(userId);
    // Same unstable_cache gotcha as the calendar route: a cache hit deserializes Date
    // fields as plain strings, so re-wrap before any Date-method usage below.
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
    const transactions: RecurringTxInput[] = rawHistory
      .filter(
        (tx): tx is typeof tx & { recurringTemplateId: string } =>
          tx.recurringTemplateId != null && templateIds.has(tx.recurringTemplateId),
      )
      .map((tx) => ({
        recurringTemplateId: tx.recurringTemplateId,
        amount: tx.amount,
        date: new Date(tx.date),
      }));

    const monthlyExpenseTotal = typeSums.find((s) => s.type === 'EXPENSE')?._sum.amount ?? 0;

    const data = deriveSubscriptionData({ templates, transactions, monthlyExpenseTotal });

    return v1Ok(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const GET = asRouteHandler(handleSubscriptions);
