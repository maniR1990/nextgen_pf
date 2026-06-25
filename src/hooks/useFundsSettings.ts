'use client';

import { useToast } from '@/components/common/ToastProvider/useToast';
import {
  apiDeleteV1,
  apiGetV1,
  apiPatchV1,
  apiPostV1,
  apiPutV1,
  getFetchErrorMessage,
} from '@/lib/query/fetcher';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { queryKeys } from '@/lib/query/queryKeys';
import type {
  CreateFundDto,
  FundAllocationInput,
  FundSummary,
  FundsAggregateSummary,
  UpdateFundDto,
} from '@/modules/funds/funds.types';

export function useFundsSettings() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data: funds = [],
    isLoading: fundsLoading,
    isError: fundsError,
  } = useQuery({
    queryKey: queryKeys.funds.list(),
    queryFn: () => apiGetV1<FundSummary[]>('/api/v1/funds?limit=100&sort=order_asc'),
    staleTime: 60_000,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: queryKeys.funds.summary(),
    queryFn: () => apiGetV1<FundsAggregateSummary>('/api/v1/funds/summary'),
    staleTime: 60_000,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.funds.all });
  }, [queryClient]);

  const createFund = useCallback(
    async (dto: CreateFundDto) => {
      try {
        await apiPostV1('/api/v1/funds', dto);
        toast.success('Fund created', { description: dto.name });
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not create fund'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const updateFund = useCallback(
    async (id: string, dto: UpdateFundDto) => {
      try {
        await apiPutV1(`/api/v1/funds/${id}`, dto);
        toast.success('Fund updated');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not update fund'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const archiveFund = useCallback(
    async (id: string) => {
      try {
        await apiPatchV1(`/api/v1/funds/${id}/archive`, {});
        toast.success('Fund archived');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not archive fund'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const deleteFund = useCallback(
    async (id: string) => {
      try {
        await apiDeleteV1(`/api/v1/funds/${id}`);
        toast.success('Fund deleted');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not delete fund'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const allocateFund = useCallback(
    async (fundId: string, accountId: string, allocation: FundAllocationInput) => {
      try {
        await apiPatchV1(`/api/v1/funds/${fundId}/allocate/${accountId}`, allocation);
        toast.success('Allocation saved');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not save allocation'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const saveAllocations = useCallback(
    async (fundId: string, allocations: FundAllocationInput[]) => {
      try {
        await apiPostV1(`/api/v1/funds/${fundId}/allocate`, { sources: allocations });
        toast.success('Allocations saved');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not save allocations'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  return {
    funds,
    summary,
    isLoading: fundsLoading || summaryLoading,
    isError: fundsError,
    createFund,
    updateFund,
    archiveFund,
    deleteFund,
    allocateFund,
    saveAllocations,
  };
}
