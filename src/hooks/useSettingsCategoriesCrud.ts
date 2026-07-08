'use client';

import type { CategoryHierarchyCrudHandlers } from '@/components/common/CategoryHierarchy/CategoryHierarchyTreeNode';
import type { CategoryHierarchyNodeJson } from '@/components/common/CategoryHierarchy/schemas';
import { useToast } from '@/components/common/ToastProvider/useToast';
import { toCategoryFlowType } from '@/constants/categories';
import type { CategoryFlowTypeSlug } from '@/constants/categories';
import {
  SETTINGS_TOAST_ARCHIVE_SUCCESS,
  SETTINGS_TOAST_CREATE_ERROR,
  SETTINGS_TOAST_CREATE_SUCCESS,
  SETTINGS_TOAST_DELETE_ERROR,
  SETTINGS_TOAST_DELETE_SUCCESS,
  SETTINGS_TOAST_LOAD_ERROR,
  SETTINGS_TOAST_UPDATE_ERROR,
  SETTINGS_TOAST_UPDATE_SUCCESS,
} from '@/constants/settings';
import {
  apiDeleteV1,
  apiGetV1,
  apiPostV1,
  apiPutV1,
  getFetchErrorMessage,
} from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { CategoryTreeNode } from '@/modules/categories/categories.types';
import { mapCategoryTreeToHierarchy } from '@/modules/categories/lib/map-category-tree-to-hierarchy';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

const CATEGORIES_LIST_PATH = '/api/v1/categories?limit=500&sort=order_asc';

export function useSettingsCategoriesCrud() {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, isFetched, error, refetch } = useQuery({
    queryKey: queryKeys.categories.tree(),
    queryFn: () => apiGetV1<CategoryTreeNode[]>(CATEGORIES_LIST_PATH),
    staleTime: 60_000,
  });

  const nodes = mapCategoryTreeToHierarchy(data ?? []);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.formOptions.categories() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.budget.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.appHeader.all });
  }, [queryClient]);

  const handleCreate = useCallback<NonNullable<CategoryHierarchyCrudHandlers['onCreate']>>(
    async ({ parentId, parentLevel, groupType }) => {
      if (parentLevel >= 2) return;

      const isRootGroup = parentLevel < 0 || parentId == null;
      const placeholder = isRootGroup
        ? `New ${groupType} group`
        : parentLevel === 0
          ? 'New category'
          : 'New subcategory';

      const input = window.prompt('Category name', placeholder);
      if (!input?.trim()) return;
      const name = input.trim();

      try {
        const payload = isRootGroup
          ? { name, type: toCategoryFlowType(groupType as CategoryFlowTypeSlug) }
          : { name, parentId };
        await apiPostV1<CategoryTreeNode>('/api/v1/categories', payload);
        toast.success(SETTINGS_TOAST_CREATE_SUCCESS, { description: name });
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, SETTINGS_TOAST_CREATE_ERROR), {
          description: SETTINGS_TOAST_CREATE_ERROR,
        });
      }
    },
    [invalidate, toast],
  );

  const handleUpdate = useCallback<NonNullable<CategoryHierarchyCrudHandlers['onUpdate']>>(
    async (node) => {
      const nextName = window.prompt('Category name', node.name);
      if (!nextName?.trim() || nextName.trim() === node.name) return;

      try {
        await apiPutV1<CategoryTreeNode>(`/api/v1/categories/${node.id}`, {
          name: nextName.trim(),
        });
        toast.success(SETTINGS_TOAST_UPDATE_SUCCESS, { description: nextName.trim() });
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, SETTINGS_TOAST_UPDATE_ERROR), {
          description: SETTINGS_TOAST_UPDATE_ERROR,
        });
      }
    },
    [invalidate, toast],
  );

  const handleDelete = useCallback<NonNullable<CategoryHierarchyCrudHandlers['onDelete']>>(
    async (node) => {
      if (node.readOnly) {
        toast.warning('System categories cannot be deleted');
        return;
      }

      const confirmed = window.confirm(
        `Remove "${node.name}"? If it (or any sub-item) has budget or transaction history, it will be archived — hidden from new activity, with all past data kept exactly as-is. Otherwise it's removed for good.`,
      );
      if (!confirmed) return;

      try {
        const result = await apiDeleteV1<{ id: string; archived: boolean; deleted: boolean }>(
          `/api/v1/categories/${node.id}`,
        );
        toast.success(
          result.archived ? SETTINGS_TOAST_ARCHIVE_SUCCESS : SETTINGS_TOAST_DELETE_SUCCESS,
          { description: node.name },
        );
        await invalidate();
      } catch (err) {
        toast.error(getFetchErrorMessage(err, SETTINGS_TOAST_DELETE_ERROR), {
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
    toast.error(getFetchErrorMessage(error, SETTINGS_TOAST_LOAD_ERROR));
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
    canEdit: (node: CategoryHierarchyNodeJson) => !node.readOnly,
    canDelete: (node: CategoryHierarchyNodeJson) => !node.readOnly,
  };
}
