'use client';

import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { SubscriptionData } from '@/app/api/v1/dashboard/subscriptions/derive';
import { useQuery } from '@tanstack/react-query';

export type DashboardSubscriptionsResponse = SubscriptionData;

export function useDashboardSubscriptions() {
  return useQuery<DashboardSubscriptionsResponse>({
    queryKey: queryKeys.dashboard.subscriptions(),
    queryFn: () => apiGetV1<DashboardSubscriptionsResponse>('/api/v1/dashboard/subscriptions'),
    staleTime: 60_000,
  });
}
