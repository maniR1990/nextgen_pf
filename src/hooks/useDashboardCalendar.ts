'use client';

import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { CalendarData } from '@/app/api/v1/dashboard/calendar/derive';
import { useQuery } from '@tanstack/react-query';

export interface CalendarTransactionDto {
  id: string;
  /** ISO date, 'YYYY-MM-DD'. */
  date: string;
  type: string;
  amount: number;
  merchant: string | null;
  categoryName: string | null;
}

export interface DashboardCalendarResponse extends CalendarData {
  year: number;
  month: number;
  transactions: CalendarTransactionDto[];
}

export function useDashboardCalendar(year: number, month: number) {
  return useQuery<DashboardCalendarResponse>({
    queryKey: queryKeys.dashboard.calendar(year, month),
    queryFn: () =>
      apiGetV1<DashboardCalendarResponse>(`/api/v1/dashboard/calendar?year=${year}&month=${month}`),
    staleTime: 30_000,
  });
}
