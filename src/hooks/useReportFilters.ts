'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export const REPORT_FILTER_DEFAULT_TYPE = 'all';
export const REPORT_FILTER_DEFAULT_ACCOUNT = 'all';

export interface ReportFilters {
  year: number;
  month: number;
  /** 'all' | 'EXPENSE' | 'INCOME' | 'INVESTMENT' */
  type: string;
  /** 'all' | a real account id */
  accountId: string;
  categoryIds: string[];
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

function currentPeriod() {
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
    const categories = searchParams.get('categories');
    return {
      year: parseIntParam(searchParams.get('year'), defaults.year),
      month: parseIntParam(searchParams.get('month'), defaults.month),
      type: searchParams.get('type') ?? REPORT_FILTER_DEFAULT_TYPE,
      accountId: searchParams.get('account') ?? REPORT_FILTER_DEFAULT_ACCOUNT,
      categoryIds: categories ? categories.split(',').filter(Boolean) : [],
    };
  }, [searchParams]);

  // Every filter lives in the URL — one sticky bar, one source of truth, and every
  // section on the page (KPI cards, the health grid, the over-budget table) reacts by
  // just re-reading its own props from the server-rendered searchParams on navigation.
  // No local "pending" filter state and no manual "apply" step: picking a value writes
  // straight through and the affected sections refetch on their own.
  const setFilters = useCallback(
    (patch: Partial<ReportFilters>) => {
      const next = { ...filters, ...patch };
      const params = new URLSearchParams();
      params.set('year', String(next.year));
      params.set('month', String(next.month));
      if (next.type !== REPORT_FILTER_DEFAULT_TYPE) params.set('type', next.type);
      if (next.accountId !== REPORT_FILTER_DEFAULT_ACCOUNT) params.set('account', next.accountId);
      if (next.categoryIds.length > 0) params.set('categories', next.categoryIds.join(','));
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

  // Back to "this month, nothing narrowed" in one shot — a clean URL, not just cleared
  // dropdowns, so a bookmarked/shared link never carries stale filter noise.
  const reset = useCallback(() => {
    const defaults = currentPeriod();
    router.replace(`${pathname}?year=${defaults.year}&month=${defaults.month}`, { scroll: false });
  }, [pathname, router]);

  const monthLabel = useMemo(
    () => `${MONTH_NAMES[filters.month - 1]} ${filters.year}`,
    [filters.year, filters.month],
  );

  return { filters, setFilters, monthLabel, goPrev, goNext, reset };
}
