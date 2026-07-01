'use client';

import { queryKeys } from '@/lib/query/queryKeys';
import type { AppHeaderData } from '@/lib/schemas/appHeader';
import { useQuery } from '@tanstack/react-query';

// Net worth is already computed server-side in the summary route — no second fetch needed.
async function fetchHeaderData(): Promise<AppHeaderData> {
  const res = await fetch('/api/v1/dashboard/summary', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return (await res.json()).data as AppHeaderData;
}

export function useAppHeaderData() {
  return useQuery<AppHeaderData>({
    queryKey: queryKeys.appHeader.summary(),
    queryFn: fetchHeaderData,
    staleTime: 5 * 60_000, // treat as fresh for 5 minutes
    gcTime: 10 * 60_000, // keep in cache for 10 minutes
    refetchInterval: 5 * 60_000,
    retry: 1,
  });
}
