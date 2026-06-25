'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface ReportFilters {
  year: number;
  month: number;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function currentPeriod(): ReportFilters {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function parseIntParam(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function useReportFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo((): ReportFilters => {
    const defaults = currentPeriod();
    return {
      year: parseIntParam(searchParams.get('year'), defaults.year),
      month: parseIntParam(searchParams.get('month'), defaults.month),
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<ReportFilters>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams();
      params.set('year', String(next.year));
      params.set('month', String(next.month));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [filters, pathname, router],
  );

  const goPrev = useCallback(() => {
    let { year, month } = filters;
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    setFilters({ year, month });
  }, [filters, setFilters]);

  const goNext = useCallback(() => {
    let { year, month } = filters;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    setFilters({ year, month });
  }, [filters, setFilters]);

  const monthLabel = useMemo(
    () => `${MONTH_NAMES[filters.month - 1]} ${filters.year}`,
    [filters.year, filters.month],
  );

  return { filters, setFilters, monthLabel, goPrev, goNext };
}
