'use client';

import { filtersToApiParams } from '@/hooks/useTransactionFilters';
import type { TransactionListFilters } from '@/lib/query/queryKeys';
import { queryKeys } from '@/lib/query/queryKeys';
import type { FinanceTransactionRow } from '@/types/finance';
import { useInfiniteQuery } from '@tanstack/react-query';

interface V1ListResponse {
  ok: boolean;
  data: ApiTxRow[];
  meta?: { hasMore?: boolean; nextCursor?: string | null };
}

interface ApiTxRow {
  id: string;
  type: FinanceTransactionRow['type'];
  date: string;
  amount: number;
  merchant?: string;
  category?: { id: string; name: string; path?: string; label?: string } | null;
  account?: { id: string; name: string; type: string } | null;
  toAccount?: { id: string; name: string } | null;
  paymentSource?: { id: string; name: string; type: string } | null;
  paymentMethod: string;
  status: string;
  isPlanned: boolean;
  isRecurring: boolean;
  notes?: string;
  tags: string[];
  budgetPeriodYear: number;
  budgetPeriodMonth: number;
  createdAt: string;
}

function mapApiRow(row: ApiTxRow): FinanceTransactionRow {
  return {
    id: row.id,
    type: row.type,
    date: row.date,
    amount: row.amount,
    merchant: row.merchant,
    categoryLabel: row.category?.name ?? row.category?.label,
    sourceLabel: row.account?.name ?? row.paymentSource?.name,
    toAccountName: row.toAccount?.name,
    method: row.paymentMethod,
    status: row.status,
    isPlanned: row.isPlanned,
    isRecurring: row.isRecurring,
    notes: row.notes,
    tags: row.tags ?? [],
    budgetPeriodYear: row.budgetPeriodYear,
    budgetPeriodMonth: row.budgetPeriodMonth,
    createdAt: row.createdAt,
  };
}

async function fetchTransactionPage(
  filters: TransactionListFilters,
  cursor?: string,
): Promise<{ rows: FinanceTransactionRow[]; hasMore: boolean; nextCursor: string | null }> {
  const params = filtersToApiParams(filters, cursor);
  const res = await fetch(`/api/v1/transactions?${params}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const json = (await res.json()) as V1ListResponse;
  return {
    rows: (json.data ?? []).map(mapApiRow),
    hasMore: json.meta?.hasMore ?? false,
    nextCursor: json.meta?.nextCursor ?? null,
  };
}

export function useTransactionsList(filters: TransactionListFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.transactions.list(filters),
    queryFn: ({ pageParam }) => fetchTransactionPage(filters, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
    staleTime: 5 * 60_000,
  });
}
