'use client';

import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import { useQuery } from '@tanstack/react-query';

export interface ReportFilterParams {
  categoryId?: string;
  type?: string;
  accountId?: string;
  year?: number;
  month?: number;
}

export interface ReportFilterResult {
  actual: number;
  count: number;
  recurringActual: number;
  /** null when not computable — see ReportsService.getFilteredReport. */
  planned: number | null;
  variance: number | null;
  pctOfPlanned: number | null;
  previousActual: number | null;
  previousChangePct: number | null;
  pctOfIncome: number | null;
  incomeForPeriod: number | null;
}

function buildQuery(params: ReportFilterParams): string {
  const sp = new URLSearchParams();
  if (params.categoryId) sp.set('categoryId', params.categoryId);
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
