'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';

export interface ReportKpiData {
  totalIncomeMinor: number;
  incomeSourceLabel: string;
  expensesSpentMinor: number;
  expensesBudgetMinor: number;
  expensesPct: number;
  expensesVariant: 'success' | 'warning' | 'error';
  investedMinor: number;
  investedLabel: string;
  budgetRemainingMinor: number;
  daysLeft: number;
  accountBalanceMinor: number;
  balanceStatus: string;
  balanceVariant: 'success' | 'warning' | 'error';
}

export function useReportKpiData(year: number, month: number) {
  return useQuery<ReportKpiData>({
    queryKey: queryKeys.reports.kpi(year, month),
    queryFn: () =>
      apiGetV1<ReportKpiData>(`/api/v1/reports/kpi?year=${year}&month=${month}`),
    staleTime: 60_000,
    retry: 1,
  });
}
