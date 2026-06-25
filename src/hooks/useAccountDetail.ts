'use client';

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/common/ToastProvider/useToast';
import { apiGetV1, apiPutV1, apiPatchV1, getFetchErrorMessage } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { AccountDetail } from '@/modules/accounts/accounts.types';
import type { UpdateAccountDto } from '@/modules/accounts/accounts.types';

export function useAccountDetail(accountId: string | null) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const queryKey = queryKeys.accounts.detail(accountId ?? '');

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => apiGetV1<AccountDetail>(`/api/v1/accounts/${accountId}`),
    enabled: Boolean(accountId),
    staleTime: 30_000,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
  }, [queryClient]);

  const update = useCallback(
    async (id: string, dto: UpdateAccountDto) => {
      try {
        await apiPutV1(`/api/v1/accounts/${id}`, dto);
        toast.success('Account updated');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not update account'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const transfer = useCallback(
    async (id: string, payload: { toAccountId: string; amount: number; note?: string; date?: string }) => {
      try {
        await apiPatchV1(`/api/v1/accounts/${id}/transfer`, payload);
        toast.success('Transfer complete');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Transfer failed'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const archive = useCallback(
    async (id: string) => {
      try {
        await apiPatchV1(`/api/v1/accounts/${id}/archive`);
        toast.success('Account archived');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not archive account'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  return { account: data ?? null, isLoading, isError, update, transfer, archive };
}
