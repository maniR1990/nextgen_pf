'use client';

import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import { useQuery } from '@tanstack/react-query';

export interface BudgetFlagCategory {
  id: string;
  name: string;
  parentName: string | null;
  amount: number;
}

export interface OverBudgetCategory extends BudgetFlagCategory {
  planned: number;
  over: number;
}

export interface BudgetFlagsResult {
  unplannedTotal: number;
  unplanned: BudgetFlagCategory[];
  overBudgetTotal: number;
  overBudget: OverBudgetCategory[];
}

export function useBudgetFlags(year: number, month: number) {
  return useQuery<BudgetFlagsResult>({
    queryKey: queryKeys.reports.budgetFlags(year, month),
    queryFn: () => apiGetV1<BudgetFlagsResult>(`/api/v1/reports/budget-flags?year=${year}&month=${month}`),
    staleTime: 60_000,
    retry: 1,
  });
}
