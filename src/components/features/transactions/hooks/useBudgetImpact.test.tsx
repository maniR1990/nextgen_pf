import { apiPostV1 } from '@/lib/query/fetcher';
import type { CategoryOption } from '@/types/finance';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBudgetImpact } from './useBudgetImpact';

vi.mock('@/lib/query/fetcher', () => ({
  apiPostV1: vi.fn().mockResolvedValue({ planned: 5000, spent: 1000 }),
}));

afterEach(() => vi.clearAllMocks());

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const CATEGORIES: CategoryOption[] = [
  { id: 'cat1', label: 'Groceries', depth: 1, plannedAmount: 5000, type: 'EXPENSE' },
];

// Regression: the API's BudgetImpactSchema requires `budgetPeriodYear` /
// `budgetPeriodMonth` — this hook was sending plain `year` / `month`, which don't match
// those field names, so the server always rejected the request with 422 (silently, since
// the hook swallows query errors and falls back to the locally-cached planned amount).
// Every categorized transaction form has been hitting this on every edit.
describe('useBudgetImpact', () => {
  it('POSTs budgetPeriodYear/budgetPeriodMonth, not year/month', async () => {
    const now = new Date();

    renderHook(
      () => useBudgetImpact({ categoryId: 'cat1', amount: '1000', categories: CATEGORIES }),
      { wrapper: makeWrapper() },
    );

    // The hook debounces 500ms before firing the query.
    await waitFor(() => expect(apiPostV1).toHaveBeenCalled(), { timeout: 2000 });

    expect(apiPostV1).toHaveBeenCalledWith('/api/v1/budget/impact', {
      categoryId: 'cat1',
      amount: 1000,
      budgetPeriodYear: now.getFullYear(),
      budgetPeriodMonth: now.getMonth() + 1,
    });
  });

  it('does not send bare year/month keys', async () => {
    renderHook(
      () => useBudgetImpact({ categoryId: 'cat1', amount: '1000', categories: CATEGORIES }),
      { wrapper: makeWrapper() },
    );

    await waitFor(() => expect(apiPostV1).toHaveBeenCalled(), { timeout: 2000 });

    const body = vi.mocked(apiPostV1).mock.calls[0][1] as Record<string, unknown>;
    expect(body.year).toBeUndefined();
    expect(body.month).toBeUndefined();
  });
});
