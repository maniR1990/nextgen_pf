'use client';

import { BUDGET_API_PATH, BUDGET_QUERY_KEY } from '@/constants/budget';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BudgetLedgerPayloadJson } from './BudgetLedger';
import type { BudgetLineFormValues } from './schemas';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

async function readJson<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new Error('Budget request failed');
  }
  return json.data;
}

export function useBudgetLedgerApi() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: BUDGET_QUERY_KEY,
    queryFn: () => fetch(BUDGET_API_PATH).then((res) => readJson<BudgetLedgerPayloadJson>(res)),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: BUDGET_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (input: { parentId: string | null; values: BudgetLineFormValues }) =>
      fetch(BUDGET_API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: input.parentId,
          title: input.values.title,
          kind: 'LINE',
          plannedMinor: input.values.plannedMinor,
          spentMinor: input.values.spentMinor,
          note: input.values.note || null,
          typeLabel: input.values.typeLabel || null,
        }),
      }).then((res) => readJson(res)),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; values: BudgetLineFormValues }) =>
      fetch(`${BUDGET_API_PATH}/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: input.values.title,
          plannedMinor: input.values.plannedMinor,
          spentMinor: input.values.spentMinor,
          note: input.values.note || null,
          typeLabel: input.values.typeLabel || null,
        }),
      }).then((res) => readJson(res)),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`${BUDGET_API_PATH}/${id}`, { method: 'DELETE' }).then((res) => readJson(res)),
    onSuccess: invalidate,
  });

  return {
    payload: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createLine: createMutation.mutateAsync,
    updateLine: (id: string, values: BudgetLineFormValues) =>
      updateMutation.mutateAsync({ id, values }),
    deleteLine: deleteMutation.mutateAsync,
    isMutating: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
