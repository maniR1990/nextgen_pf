'use client';

import { queryKeys } from '@/lib/query/queryKeys';
import type { AppHeaderData } from '@/lib/schemas/appHeader';
import { useQuery } from '@tanstack/react-query';

async function fetchHeaderData(): Promise<AppHeaderData> {
  const res = await fetch('/api/v1/dashboard/summary', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  const json = await res.json();
  return json.data as AppHeaderData;
}

export function useAppHeaderData() {
  return useQuery<AppHeaderData>({
    queryKey: queryKeys.appHeader.summary(),
    queryFn: fetchHeaderData,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}
