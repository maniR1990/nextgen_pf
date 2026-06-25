'use client';

import { useEffect, useState, useRef } from 'react';
import type { DuplicateMatch } from '@/types/finance';

interface Props {
  merchant: string;
  amount: string;
  date: string;
  isDismissed: boolean;
  enabled: boolean;
}

export function useDuplicateDetect({ merchant, amount, date, isDismissed, enabled }: Props): DuplicateMatch | null {
  const [duplicate, setDuplicate] = useState<DuplicateMatch | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || isDismissed) {
      setDuplicate(null);
      return;
    }

    const amountNum = parseFloat(amount);
    if (!merchant.trim() || isNaN(amountNum) || amountNum <= 0 || !date) {
      setDuplicate(null);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/v1/transactions/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchant, amount: amountNum, date }),
        });

        if (!res.ok) return;

        const json = await res.json();
        const matches: DuplicateMatch[] = Array.isArray(json.data) ? json.data : [];
        setDuplicate(matches.length > 0 ? matches[0] : null);
      } catch {
        setDuplicate(null);
      }
    }, 800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [merchant, amount, date, isDismissed, enabled]);

  return duplicate;
}
