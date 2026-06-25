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
  sinkingFunds: FormSinkingFundOption[];
}

const ACCOUNTS_LIST_PATH = '/api/v1/accounts?limit=100&sort=name_asc';
const CATEGORIES_LIST_PATH = '/api/v1/categories?limit=500&sort=order_asc';

async function fetchSources(): Promise<FormSourceOption[]> {
  const groups = await apiGetV1<AccountGroupWithAccounts[]>(ACCOUNTS_LIST_PATH);
  return flattenAccountsForPicker(groups);
}

async function fetchSinkingFunds(): Promise<FormSinkingFundOption[]> {
  const res = await fetch('/api/v1/sinking-funds');
  if (!res.ok) throw new Error('Failed to load sinking funds');
  const json = await res.json();
  return (json.data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    label: r.name,
    target: r.targetAmount,
    saved: r.currentBalance,
    monthly: r.monthlyContribution,
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

  return {
    sources: sources.data ?? [],
    categories,
    categoryGroups,
    sinkingFunds: sinkingFunds.data ?? [],
    isLoading: sources.isLoading || treeQuery.isLoading || sinkingFunds.isLoading,
    isError: sources.isError || treeQuery.isError || sinkingFunds.isError,
  };
}
