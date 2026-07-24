'use client';

import type {
  FormCategoryOption,
  FormSinkingFundOption,
  FormSourceOption,
} from '@/lib/data/transaction-options';
import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';
import { flattenAccountsForPicker } from '@/modules/accounts/lib/flatten-accounts-for-picker';
import type { CategoryTreeNode } from '@/modules/categories/categories.types';
import {
  buildPickerGroups,
  mapCategoryTreeToPickerOptions,
  mapCategoryTreeToReportPickerOptions,
} from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export type { FormSourceOption, FormCategoryOption, FormSinkingFundOption };
export type { PickerGroup };

export interface FormOptions {
  sources: FormSourceOption[];
  categories: FormCategoryOption[];
  /** Optional — if omitted the hook derives groups from the tree query. */
  categoryGroups?: PickerGroup[];
  /** Optional — every category is selectable (including parents with children), for
   *  report filtering rather than transaction entry. If omitted the hook derives it. */
  reportCategories?: FormCategoryOption[];
  sinkingFunds: FormSinkingFundOption[];
}

const ACCOUNTS_LIST_PATH = '/api/v1/accounts?limit=100&sort=name_asc';
const CATEGORIES_LIST_PATH = '/api/v1/categories?limit=500&sort=order_asc';

async function fetchSources(): Promise<FormSourceOption[]> {
  const groups = await apiGetV1<AccountGroupWithAccounts[]>(ACCOUNTS_LIST_PATH);
  return flattenAccountsForPicker(groups);
}

async function fetchSinkingFunds(): Promise<FormSinkingFundOption[]> {
  const funds = await apiGetV1<
    Array<{ id: string; name: string; targetAmount: number; targetMonths: number | null; currentAmount: number }>
  >('/api/v1/funds?purpose=SINKING&limit=100');
  return funds.map((f) => ({
    id: f.id,
    label: f.name,
    target: f.targetAmount,
    saved: f.currentAmount,
    monthly: f.targetMonths ? f.targetAmount / f.targetMonths : 0,
  }));
}

async function fetchCategoryTree(): Promise<CategoryTreeNode[]> {
  return apiGetV1<CategoryTreeNode[]>(CATEGORIES_LIST_PATH);
}

/** Fetch all form options with parallel requests, deduplicated by React Query. */
export function useFormOptions(initialData?: FormOptions) {
  const sources = useQuery({
    queryKey: queryKeys.formOptions.sources(),
    queryFn: fetchSources,
    staleTime: 5 * 60 * 1000,
    initialData: initialData?.sources,
  });

  const treeQuery = useQuery({
    queryKey: queryKeys.formOptions.categories(),
    queryFn: fetchCategoryTree,
    staleTime: 5 * 60 * 1000,
  });

  const sinkingFunds = useQuery({
    queryKey: ['form-options', 'sinking-funds'],
    queryFn: fetchSinkingFunds,
    staleTime: 5 * 60 * 1000,
    initialData: initialData?.sinkingFunds,
  });

  const categories = useMemo(
    () =>
      treeQuery.data
        ? mapCategoryTreeToPickerOptions(treeQuery.data)
        : (initialData?.categories ?? []),
    [treeQuery.data, initialData?.categories],
  );

  const categoryGroups = useMemo(
    () =>
      treeQuery.data ? buildPickerGroups(treeQuery.data) : (initialData?.categoryGroups ?? []),
    [treeQuery.data, initialData?.categoryGroups],
  );

  const reportCategories = useMemo(
    () =>
      treeQuery.data
        ? mapCategoryTreeToReportPickerOptions(treeQuery.data)
        : (initialData?.reportCategories ?? []),
    [treeQuery.data, initialData?.reportCategories],
  );

  return {
    sources: sources.data ?? [],
    categories,
    categoryGroups,
    reportCategories,
    sinkingFunds: sinkingFunds.data ?? [],
    isLoading: sources.isLoading || treeQuery.isLoading || sinkingFunds.isLoading,
    isError: sources.isError || treeQuery.isError || sinkingFunds.isError,
  };
}
