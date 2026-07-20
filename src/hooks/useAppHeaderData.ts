'use client';

import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { AppHeaderData } from '@/lib/schemas/appHeader';
import { useQuery } from '@tanstack/react-query';

// Net worth is already computed server-side in the summary route — no second fetch needed.
// Uses apiGetV1 (not a raw fetch) so an expired session here behaves the same as anywhere
// else in the app — refresh-and-retry, or a redirect to login — instead of silently
// throwing and leaving the header stuck on stale fallback data while other screens
// correctly bounce to /login.
function fetchHeaderData(): Promise<AppHeaderData> {
  return apiGetV1<AppHeaderData>('/api/v1/dashboard/summary');
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
