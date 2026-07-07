'use client';

import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import { useQuery } from '@tanstack/react-query';

export interface TransactionsPeriodSummary {
  totalIncome: number;
  totalExpense: number;
  net: number;
}

// Whole-period totals from the server, independent of how many pages of the
// transaction list have been fetched — see useTransactionsList for the paginated rows.
export function useTransactionsSummary(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.transactions.summary(year, month),
    queryFn: () =>
      apiGetV1<TransactionsPeriodSummary>(
        `/api/v1/transactions/summary?budgetPeriodYear=${year}&budgetPeriodMonth=${month}`,
      ),
    staleTime: 60_000,
  });
}
