'use client';

import { apiDeleteV1, apiGetV1, apiPostV1, apiPutV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type {
  BudgetCategoryNode,
  BudgetSummaryResponse,
} from '@/modules/budget-engine/budget-engine.types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── helpers ───────────────────────────────────────────────────────────────────

type PlanPatch = { planned?: number; isRecurring?: boolean; isUnplanned?: boolean };

/** Recursively find-and-patch a node in the category tree, recomputing its own metrics. */
function patchNodeInTree(
  nodes: BudgetCategoryNode[],
  categoryId: string,
  patch: PlanPatch,
): BudgetCategoryNode[] {
  return nodes.map((node) => {
    if (node.id === categoryId) {
      const planned = patch.planned ?? node.planned;
      const actual = node.actual;
      const variance = actual - planned;
      const variancePct = planned > 0 ? Math.round((variance / planned) * 100) : 0;
      const progressPct = planned > 0 ? Math.round((actual / planned) * 100) : actual > 0 ? 100 : 0;
      return {
        ...node,
        planned,
        variance,
        variancePct,
        progressPct,
        isRecurring: patch.isRecurring ?? node.isRecurring,
        isUnplanned: patch.isUnplanned ?? node.isUnplanned,
      };
    }
    if (node.children.length > 0) {
      return { ...node, children: patchNodeInTree(node.children, categoryId, patch) };
    }
    return node;
  });
}

function applyOptimisticPatch(
  summary: BudgetSummaryResponse,
  categoryId: string,
  patch: PlanPatch,
): BudgetSummaryResponse {
  return {
    ...summary,
    groups: summary.groups.map((g) => ({
      ...g,
      categories: patchNodeInTree(g.categories, categoryId, patch),
    })),
  };
}

// ── hooks ─────────────────────────────────────────────────────────────────────

export function useBudgetSummary(year: number, month: number) {
  return useQuery<BudgetSummaryResponse>({
    queryKey: queryKeys.budget.summary(year, month),
    queryFn: () => apiGetV1<BudgetSummaryResponse>(`/api/v1/budget/${year}/${month}`),
    staleTime: 30_000,
  });
}

export function useSeedRecurring(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPostV1(`/api/v1/budget/${year}/${month}/seed`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.budget.summary(year, month) });
    },
  });
}

/**
 * Update a budget plan for one category.
 * Uses optimistic updates so the row feels instant:
 *   - patches the cache immediately on mutate
 *   - rolls back on error
 *   - re-fetches on settled for accurate rollup/variance
 */
export function useUpdateBudgetPlan(year: number, month: number) {
  const qc = useQueryClient();
  const key = queryKeys.budget.summary(year, month);

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: PlanPatch }) =>
      apiPutV1(`/api/v1/budget/${year}/${month}/categories/${categoryId}`, data),

    onMutate: async ({ categoryId, data }) => {
      // Cancel any outgoing re-fetches so they don't overwrite our optimistic data
      await qc.cancelQueries({ queryKey: key });
      const snapshot = qc.getQueryData<BudgetSummaryResponse>(key);

      if (snapshot) {
        qc.setQueryData<BudgetSummaryResponse>(
          key,
          applyOptimisticPatch(snapshot, categoryId, data),
        );
      }

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(key, ctx.snapshot);
    },

    onSettled: () => {
      // Always re-sync from server so parent rollups and group totals are accurate
      void qc.invalidateQueries({ queryKey: key });
    },
  });
}

/** Rename a category — invalidates both the budget summary and the form-options cache. */
export function useRenameCategory(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiPutV1(`/api/v1/categories/${id}`, { name }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.budget.summary(year, month) });
      void qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      void qc.invalidateQueries({ queryKey: queryKeys.formOptions.categories() });
      void qc.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    },
  });
}

/** Delete a category — budget rows and form options are both stale after deletion. */
export function useDeleteCategory(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string }) => apiDeleteV1(`/api/v1/categories/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.budget.summary(year, month) });
      void qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      void qc.invalidateQueries({ queryKey: queryKeys.formOptions.categories() });
      void qc.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
    },
  });
}

/**
 * Create a new category (L1 or L2) and optionally seed its budget plan for the given period.
 * Two-step operation kept in one mutation so React Query tracks it as a single unit.
 */
export function useAddBudgetCategory(year: number, month: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parentId,
      name,
      planned,
      isRecurring,
      isUnplanned,
    }: {
      parentId: string;
      name: string;
      planned: number;
      isRecurring: boolean;
      isUnplanned: boolean;
    }) => {
      const { id } = await apiPostV1<{ id: string }>('/api/v1/categories', { name, parentId });
      if (planned > 0 || isRecurring || isUnplanned) {
        await apiPostV1(`/api/v1/budget/${year}/${month}/categories/${id}`, {
          planned,
          isRecurring,
          isUnplanned,
        });
      }
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.budget.summary(year, month) });
      void qc.invalidateQueries({ queryKey: queryKeys.categories.all });
      void qc.invalidateQueries({ queryKey: queryKeys.formOptions.categories() });
    },
  });
}
