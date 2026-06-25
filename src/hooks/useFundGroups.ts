'use client';

import { useToast } from '@/components/common/ToastProvider/useToast';
import {
  apiDeleteV1,
  apiGetV1,
  apiPatchV1,
  apiPostV1,
  getFetchErrorMessage,
} from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type {
  CreateFundGroupDto,
  FundGroupSummary,
  UpdateFundGroupDto,
} from '@/modules/fund-groups/fund-groups.types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export function useFundGroups() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data: groups = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.fundGroups.list(),
    queryFn: () => apiGetV1<FundGroupSummary[]>('/api/v1/fund-groups?includeArchived=true'),
    staleTime: 60_000,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.fundGroups.all });
  }, [queryClient]);

  const createGroup = useCallback(
    async (dto: CreateFundGroupDto) => {
      try {
        await apiPostV1('/api/v1/fund-groups', dto);
        toast.success('Group created', { description: dto.name });
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not create group'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const updateGroup = useCallback(
    async (id: string, dto: UpdateFundGroupDto) => {
      try {
        await apiPatchV1(`/api/v1/fund-groups/${id}`, dto);
        toast.success('Group updated');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not update group'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const deleteGroup = useCallback(
    async (id: string) => {
      try {
        await apiDeleteV1(`/api/v1/fund-groups/${id}`);
        toast.success('Group deleted');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not delete group'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  const restoreGroup = useCallback(
    async (id: string) => {
      try {
        await apiPostV1(`/api/v1/fund-groups/${id}/restore`, {});
        toast.success('Group restored');
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, 'Could not restore group'));
        throw err;
      }
    },
    [invalidate, toast],
  );

  return {
    groups,
    isLoading,
    isError,
    createGroup,
    updateGroup,
    deleteGroup,
    restoreGroup,
  };
}
