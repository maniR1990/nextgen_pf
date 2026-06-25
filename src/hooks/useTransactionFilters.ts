'use client';

import {
  TRANSACTION_DEFAULT_SORT,
  TRANSACTION_FILTER_ALL,
  type TransactionFilterChip,
  type TransactionSort,
  chipToApiTypes,
} from '@/constants/transactions';
import type { TransactionListFilters } from '@/lib/query/queryKeys';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function currentBudgetPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function parseTransactionFilters(searchParams: URLSearchParams): TransactionListFilters {
  const defaults = currentBudgetPeriod();
  const typeChip = (searchParams.get('type') ?? TRANSACTION_FILTER_ALL) as TransactionFilterChip;
  const sort = (searchParams.get('sort') ?? TRANSACTION_DEFAULT_SORT) as TransactionSort;
  const account = searchParams.get('account') ?? undefined;
  const status = searchParams.get('status') ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  return {
    year: parseIntParam(searchParams.get('year'), defaults.year),
    month: parseIntParam(searchParams.get('month'), defaults.month),
    typeChip,
    paymentSourceId: account && account !== 'all' ? account : undefined,
    status,
    search,
    sort,
  };
}

export function filtersToQueryString(filters: TransactionListFilters): string {
  const params = new URLSearchParams();
  params.set('year', String(filters.year));
  params.set('month', String(filters.month));
  if (filters.typeChip !== TRANSACTION_FILTER_ALL) {
    params.set('type', filters.typeChip);
  }
  if (filters.paymentSourceId) {
    params.set('account', filters.paymentSourceId);
  }
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.sort !== TRANSACTION_DEFAULT_SORT) {
    params.set('sort', filters.sort);
  }
  return params.toString();
}

export function filtersToApiParams(
  filters: TransactionListFilters,
  cursor?: string,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('budgetPeriodYear', String(filters.year));
  params.set('budgetPeriodMonth', String(filters.month));
  params.set('limit', '20');
  params.set('sort', filters.sort);

  const apiTypes = chipToApiTypes(filters.typeChip);
  if (apiTypes?.length === 1) params.set('type', apiTypes[0]!);
  else if (apiTypes && apiTypes.length > 1) params.set('types', apiTypes.join(','));

  if (filters.paymentSourceId) params.set('paymentSourceId', filters.paymentSourceId);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (cursor) params.set('cursor', cursor);
  return params;
}

export function useTransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseTransactionFilters(searchParams), [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<TransactionListFilters>) => {
      const next = { ...filters, ...patch };
      const qs = filtersToQueryString(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const monthLabel = useMemo(() => {
    const d = new Date(filters.year, filters.month - 1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }, [filters.year, filters.month]);

  return { filters, setFilters, monthLabel };
}
