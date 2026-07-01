'use client';

import { apiPostV1 } from '@/lib/query/fetcher';
import type { DuplicateMatch } from '@/types/finance';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface Props {
  merchant: string;
  amount: string;
  date: string;
  isDismissed: boolean;
  enabled: boolean;
}

interface DuplicateResponse {
  matches: DuplicateMatch[];
}

/**
 * Detects likely duplicate transactions while the user fills the form.
 *
 * Debounces the query key (800 ms) so the server isn't hit on every keystroke.
 * React Query caches results per (merchant, amount, date) — reopening the same
 * form returns immediately without a round-trip.
 */
export function useDuplicateDetect({
  merchant,
  amount,
  date,
  isDismissed,
  enabled: featureEnabled,
}: Props): DuplicateMatch | null {
  const amountNum = Number.parseFloat(amount);
  const canCheck =
    featureEnabled &&
    !isDismissed &&
    !!merchant.trim() &&
    !Number.isNaN(amountNum) &&
    amountNum > 0 &&
    !!date;

  // Debounce: wait 800 ms of silence before querying
  const [debouncedKey, setDebouncedKey] = useState({ merchant, amountNum, date });
  useEffect(() => {
    if (!canCheck) return;
    const t = setTimeout(() => setDebouncedKey({ merchant, amountNum, date }), 800);
    return () => clearTimeout(t);
  }, [merchant, amountNum, date, canCheck]);

  const { data } = useQuery<DuplicateMatch | null>({
    queryKey: ['duplicate-check', debouncedKey.merchant, debouncedKey.amountNum, debouncedKey.date],
    queryFn: async () => {
      const res = await apiPostV1<DuplicateResponse>('/api/v1/transactions/check-duplicate', {
        merchant: debouncedKey.merchant,
        amount: debouncedKey.amountNum,
        date: debouncedKey.date,
      });
      const matches = Array.isArray(res) ? res : ((res as DuplicateResponse).matches ?? []);
      return matches.length > 0 ? matches[0] : null;
    },
    enabled: canCheck,
    staleTime: 30_000, // same inputs reused for 30 s
    gcTime: 60_000,
    retry: false,
  });

  // Return null when dismissed or feature disabled — even if cache has data
  if (!featureEnabled || isDismissed) return null;

  return data ?? null;
}
