import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const replace = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/dashboard/reports',
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

// Fri 18 Jul 2026 — matches how the hook reads `new Date()` for its "current period"
// default and for Reset.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 18));
  replace.mockClear();
  currentSearch = '';
});

describe('useReportFilters', () => {
  it('defaults to the current month with every other filter unset', async () => {
    const { useReportFilters } = await import('./useReportFilters');
    const { result } = renderHook(() => useReportFilters());

    expect(result.current.filters).toEqual({
      year: 2026,
      month: 7,
      type: 'all',
      accountId: 'all',
      categoryIds: [],
    });
    expect(result.current.monthLabel).toBe('July 2026');
  });

  it('parses type, account, and categories from the URL', async () => {
    currentSearch = 'year=2026&month=6&type=EXPENSE&account=acc1&categories=cat1,cat2';
    const { useReportFilters } = await import('./useReportFilters');
    const { result } = renderHook(() => useReportFilters());

    expect(result.current.filters).toEqual({
      year: 2026,
      month: 6,
      type: 'EXPENSE',
      accountId: 'acc1',
      categoryIds: ['cat1', 'cat2'],
    });
  });

  it('writes only the non-default filters into the URL, keeping it clean', async () => {
    const { useReportFilters } = await import('./useReportFilters');
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.setFilters({ type: 'EXPENSE' }));

    expect(replace).toHaveBeenCalledWith('/dashboard/reports?year=2026&month=7&type=EXPENSE', {
      scroll: false,
    });
  });

  it('omits type/account/categories from the URL once they are back to their defaults', async () => {
    currentSearch = 'year=2026&month=7&type=EXPENSE';
    const { useReportFilters } = await import('./useReportFilters');
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.setFilters({ type: 'all' }));

    expect(replace).toHaveBeenCalledWith('/dashboard/reports?year=2026&month=7', {
      scroll: false,
    });
  });

  it('goPrev/goNext roll the year over at the calendar boundary', async () => {
    currentSearch = 'year=2026&month=1';
    const { useReportFilters } = await import('./useReportFilters');
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.goPrev());
    expect(replace).toHaveBeenCalledWith('/dashboard/reports?year=2025&month=12', {
      scroll: false,
    });

    currentSearch = 'year=2026&month=12';
    const { result: result2 } = renderHook(() => useReportFilters());
    act(() => result2.current.goNext());
    expect(replace).toHaveBeenCalledWith('/dashboard/reports?year=2027&month=1', {
      scroll: false,
    });
  });

  it('reset clears every filter and re-centers on the current month', async () => {
    currentSearch = 'year=2020&month=1&type=INCOME&account=acc1&categories=cat1';
    const { useReportFilters } = await import('./useReportFilters');
    const { result } = renderHook(() => useReportFilters());

    act(() => result.current.reset());

    expect(replace).toHaveBeenCalledWith('/dashboard/reports?year=2026&month=7', {
      scroll: false,
    });
  });
});
