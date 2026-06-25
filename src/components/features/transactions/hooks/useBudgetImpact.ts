'use client';

import type { BudgetImpact, CategoryOption } from '@/types/finance';
import { useEffect, useRef, useState } from 'react';

interface Props {
  categoryId: string;
  amount: string;
  categories: CategoryOption[];
}

export function useBudgetImpact({ categoryId, amount, categories }: Props): BudgetImpact | null {
  const [impact, setImpact] = useState<BudgetImpact | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setImpact(null);
      return;
    }

    const amountNum = Number.parseFloat(amount) || 0;
    const category = categories.find((c) => c.id === categoryId);
    if (!category) {
      setImpact(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const now = new Date();
        const res = await fetch('/api/v1/budget/impact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId,
            amount: amountNum,
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          }),
        });

        if (!res.ok) throw new Error('impact fetch failed');

        const json = await res.json();
        const d = json.data;
        if (!d) return;

        const planned = d.planned ?? category.plannedAmount ?? 0;
        if (planned === 0) {
          setImpact(null);
          return;
        }

        const newSpent = d.spent + amountNum;
        const remaining = planned - newSpent;
        const percentUsed = Math.min(Math.round((newSpent / planned) * 100), 100);
        let state: BudgetImpact['state'] = 'ok';
        if (remaining < 0) state = 'over';
        else if (percentUsed >= 80) state = 'warning';

        setImpact({
          categoryId,
          categoryLabel: category.label,
          planned,
          spent: d.spent,
          thisTx: amountNum,
          remaining,
          percentUsed,
          state,
        });
      } catch {
        // Fallback to local calculation from category data
        const planned = category.plannedAmount ?? 0;
        if (!planned) {
          setImpact(null);
          return;
        }
        setImpact({
          categoryId,
          categoryLabel: category.label,
          planned,
          spent: 0,
          thisTx: amountNum,
          remaining: planned - amountNum,
          percentUsed: Math.min(Math.round((amountNum / planned) * 100), 100),
          state: amountNum > planned ? 'over' : amountNum / planned >= 0.8 ? 'warning' : 'ok',
        });
      }
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [categoryId, amount, categories]);

  return impact;
}
