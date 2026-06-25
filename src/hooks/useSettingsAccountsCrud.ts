'use client';

import type { CategoryHierarchyCrudHandlers } from '@/components/common/CategoryHierarchy/CategoryHierarchyTreeNode';
import type { CategoryHierarchyNodeJson } from '@/components/common/CategoryHierarchy/schemas';
import { useToast } from '@/components/common/ToastProvider/useToast';
import {
  SETTINGS_ACCOUNT_TOAST_CREATE_ERROR,
  SETTINGS_ACCOUNT_TOAST_CREATE_SUCCESS,
  SETTINGS_ACCOUNT_TOAST_DELETE_ERROR,
  SETTINGS_ACCOUNT_TOAST_DELETE_SUCCESS,
  SETTINGS_ACCOUNT_TOAST_LOAD_ERROR,
  SETTINGS_ACCOUNT_TOAST_UPDATE_ERROR,
  SETTINGS_ACCOUNT_TOAST_UPDATE_SUCCESS,
} from '@/constants/settings';
import {
  apiDeleteV1,
  apiGetV1,
  apiPatchV1,
  apiPostV1,
  apiPutV1,
  getFetchErrorMessage,
} from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';
import { mapAccountGroupsToHierarchy } from '@/modules/accounts/lib/map-account-groups-to-hierarchy';
import type { AccountType } from '@prisma/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

const ACCOUNTS_LIST_PATH = '/api/v1/accounts?limit=100&sort=name_asc';

function defaultAccountType(groupType: 'asset' | 'liability'): AccountType {
  return groupType === 'liability' ? 'CREDIT_CARD' : 'BANK_SAVINGS';
}

export function useSettingsAccountsCrud() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetched, error, refetch } = useQuery({
    queryKey: queryKeys.accounts.list(),
    queryFn: () => apiGetV1<AccountGroupWithAccounts[]>(ACCOUNTS_LIST_PATH),
    staleTime: 60_000,
  });

  const nodes = mapAccountGroupsToHierarchy(data ?? []);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.formOptions.sources() });
    await queryClient.invalidateQueries({ queryKey: queryKeys.paymentSources.all });
  }, [queryClient]);

  const handleCreate = useCallback<NonNullable<CategoryHierarchyCrudHandlers['onCreate']>>(
    async ({ parentId, parentLevel, groupType }) => {
      const isRootGroup = parentLevel < 0 || parentId == null;
      const placeholder = isRootGroup ? 'New account group' : 'New account';
      const input = window.prompt(isRootGroup ? 'Group name' : 'Account name', placeholder);
      if (!input?.trim()) return;
      const name = input.trim();

      try {
        if (isRootGroup) {
          await apiPostV1('/api/v1/account-groups', {
            name,
            type: groupType,
          });
        } else if (parentLevel === 0 && parentId) {
          await apiPostV1('/api/v1/accounts', {
            name,
            groupId: parentId,
            type: defaultAccountType(groupType),
          });
        }
        toast.success(SETTINGS_ACCOUNT_TOAST_CREATE_SUCCESS, { description: name });
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, SETTINGS_ACCOUNT_TOAST_CREATE_ERROR), {
          description: SETTINGS_ACCOUNT_TOAST_CREATE_ERROR,
        });
      }
    },
    [invalidate, toast],
  );

  const handleUpdate = useCallback<NonNullable<CategoryHierarchyCrudHandlers['onUpdate']>>(
    async (node) => {
      const nextName = window.prompt(node.level === 0 ? 'Group name' : 'Account name', node.name);
      if (!nextName?.trim() || nextName.trim() === node.name) return;

      try {
        const path =
          node.level === 0 ? `/api/v1/account-groups/${node.id}` : `/api/v1/accounts/${node.id}`;
        await apiPutV1(path, { name: nextName.trim() });
        toast.success(SETTINGS_ACCOUNT_TOAST_UPDATE_SUCCESS, { description: nextName.trim() });
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, SETTINGS_ACCOUNT_TOAST_UPDATE_ERROR), {
          description: SETTINGS_ACCOUNT_TOAST_UPDATE_ERROR,
        });
      }
    },
    [invalidate, toast],
  );

  const handleDelete = useCallback<NonNullable<CategoryHierarchyCrudHandlers['onDelete']>>(
    async (node) => {
      try {
        if (node.level === 0) {
          await apiDeleteV1(`/api/v1/account-groups/${node.id}`);
        } else {
          await apiPatchV1(`/api/v1/accounts/${node.id}/archive`);
        }
        toast.success(SETTINGS_ACCOUNT_TOAST_DELETE_SUCCESS, { description: node.name });
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, SETTINGS_ACCOUNT_TOAST_DELETE_ERROR), {
          description: node.name,
        });
      }
    },
    [invalidate, toast],
  );

  const loadErrorToastShown = useRef(false);

  useEffect(() => {
    if (!isError) {
      loadErrorToastShown.current = false;
      return;
    }
    if (!isFetched || !error || loadErrorToastShown.current) return;
    loadErrorToastShown.current = true;
    toast.error(getFetchErrorMessage(error, SETTINGS_ACCOUNT_TOAST_LOAD_ERROR));
  }, [error, isError, isFetched, toast]);

  return {
    nodes,
    isLoading,
    isError,
    isFetched,
    refetch,
    handleCreate,
    handleUpdate,
    handleDelete,
    canEdit: () => true,
    canDelete: () => true,
  };
}
