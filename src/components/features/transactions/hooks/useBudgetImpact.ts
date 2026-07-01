'use client';

import { apiPostV1 } from '@/lib/query/fetcher';
import type { BudgetImpact, CategoryOption } from '@/types/finance';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface Props {
  categoryId: string;
  amount: string;
  categories: CategoryOption[];
}

interface ImpactResponse {
  planned?: number;
  spent: number;
}

/**
 * Real-time budget impact for the transaction form.
 *
 * Uses a debounced query key so the server isn't hit on every keystroke.
 * React Query caches results per (categoryId, amount, month) — if the user
 * types the same amount twice, the second render is instant.
 */
export function useBudgetImpact({ categoryId, amount, categories }: Props): BudgetImpact | null {
  const amountNum = Number.parseFloat(amount) || 0;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Debounce the key: only update after the user stops typing for 500 ms
  const [debouncedKey, setDebouncedKey] = useState({ categoryId, amountNum });
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKey({ categoryId, amountNum }), 500);
    return () => clearTimeout(t);
  }, [categoryId, amountNum]);

  const category = categories.find((c) => c.id === debouncedKey.categoryId);
  const enabled = !!debouncedKey.categoryId && debouncedKey.amountNum > 0 && !!category;

  const { data } = useQuery<ImpactResponse | null>({
    queryKey: ['budget-impact', debouncedKey.categoryId, debouncedKey.amountNum, year, month],
    queryFn: async () => {
      const res = await apiPostV1<ImpactResponse>('/api/v1/budget/impact', {
        categoryId: debouncedKey.categoryId,
        amount: debouncedKey.amountNum,
        year,
        month,
      });
      return res;
    },
    enabled,
    staleTime: 60_000, // same category+amount combo reused for 1 min
    gcTime: 2 * 60_000,
    // On network error, fall back silently — component shows nothing
    retry: false,
  });

  if (!category || !debouncedKey.categoryId) return null;

  // Server returned data
  if (data) {
    const planned = data.planned ?? category.plannedAmount ?? 0;
    if (!planned) return null;
    const newSpent = data.spent + debouncedKey.amountNum;
    const remaining = planned - newSpent;
    const percentUsed = Math.min(Math.round((newSpent / planned) * 100), 100);
    const state: BudgetImpact['state'] =
      remaining < 0 ? 'over' : percentUsed >= 80 ? 'warning' : 'ok';
    return {
      categoryId: debouncedKey.categoryId,
      categoryLabel: category.label,
      planned,
      spent: data.spent,
      thisTx: debouncedKey.amountNum,
      remaining,
      percentUsed,
      state,
    };
  }

  // Fallback: compute locally from cached category planned amount while query loads
  const planned = category.plannedAmount ?? 0;
  if (!planned || !enabled) return null;
  const remaining = planned - debouncedKey.amountNum;
  const percentUsed = Math.min(Math.round((debouncedKey.amountNum / planned) * 100), 100);
  return {
    categoryId: debouncedKey.categoryId,
    categoryLabel: category.label,
    planned,
    spent: 0,
    thisTx: debouncedKey.amountNum,
    remaining,
    percentUsed,
    state: remaining < 0 ? 'over' : percentUsed >= 80 ? 'warning' : 'ok',
  };
}
