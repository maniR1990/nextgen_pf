'use client';

import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import { useQuery } from '@tanstack/react-query';

export interface ReportFilterParams {
  categoryIds?: string[];
  type?: string;
  accountId?: string;
  year?: number;
  month?: number;
}

export interface ReportFilterTypeBreakdown {
  type: 'INCOME' | 'EXPENSE' | 'INVESTMENT';
  actual: number;
  recurringActual: number;
  count: number;
  planned: number | null;
  variance: number | null;
  pctOfIncome: number | null;
}

export interface ReportFilterResult {
  count: number;
  /** null when `byType` is populated — see ReportsService.getFilteredReport. */
  actual: number | null;
  recurringActual: number | null;
  /** null when not computable — see ReportsService.getFilteredReport. */
  planned: number | null;
  variance: number | null;
  pctOfPlanned: number | null;
  pctOfIncome: number | null;
  incomeForPeriod: number | null;
  /** Populated instead of the single-number fields above when there's no single type or
   *  category to anchor "actual" to — see ReportsService.getFilteredReport. */
  byType: ReportFilterTypeBreakdown[] | null;
}

function buildQuery(params: ReportFilterParams): string {
  const sp = new URLSearchParams();
  if (params.categoryIds && params.categoryIds.length > 0) {
    sp.set('categoryIds', params.categoryIds.join(','));
  }
  if (params.type) sp.set('type', params.type);
  if (params.accountId) sp.set('accountId', params.accountId);
  if (params.year !== undefined && params.month !== undefined) {
    sp.set('year', String(params.year));
    sp.set('month', String(params.month));
  }
  return sp.toString();
}

/** enabled: false — this is an explicit "filter, then Check" query, not a live one. */
export function useReportFilter(params: ReportFilterParams) {
  return useQuery({
    queryKey: queryKeys.reports.filter(params as Record<string, unknown>),
    queryFn: () => apiGetV1<ReportFilterResult>(`/api/v1/reports/filter?${buildQuery(params)}`),
    enabled: false,
  });
}
