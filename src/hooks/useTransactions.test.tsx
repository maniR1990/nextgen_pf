import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  useCreateBulkTransaction,
  useCreateTransaction,
  useDeleteTransaction,
  usePatchTransaction,
  useVoidTransaction,
} from './useTransactions';
import { apiDeleteV1, apiPatchV1, apiPostV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { ReactNode } from 'react';

vi.mock('@/lib/query/fetcher', () => ({
  apiPostV1: vi.fn().mockResolvedValue({ id: 'tx1' }),
  apiPatchV1: vi.fn().mockResolvedValue({ id: 'tx1' }),
  apiDeleteV1: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/components/common/ToastProvider/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

const body = {
  type: 'EXPENSE',
  date: '2026-07-05',
  budgetPeriodYear: 2026,
  budgetPeriodMonth: 7,
  amount: 500,
  paymentSourceId: 'acc1',
  paymentMethod: 'UPI',
  isPlanned: true,
  isRecurring: false,
};

afterEach(() => vi.clearAllMocks());

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidateSpy = vi.spyOn(qc, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateSpy };
}

// Every dashboard widget aggregates the same FinanceTransaction rows these mutations
// write — without invalidating queryKeys.dashboard.all, the dashboard would keep
// showing pre-edit totals after a create/patch/delete/void until its own staleTime
// happened to lapse, visibly disagreeing with the just-edited Transactions page.
describe('useTransactions dashboard invalidation', () => {
  it('invalidates dashboard queries on create', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useCreateTransaction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(body as never);
    });

    expect(apiPostV1).toHaveBeenCalled();
    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(queryKeys.dashboard.all);
  });

  it('invalidates dashboard queries on patch', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => usePatchTransaction('tx1'), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(body as never);
    });

    expect(apiPatchV1).toHaveBeenCalled();
    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(queryKeys.dashboard.all);
  });

  it('invalidates dashboard queries on delete', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useDeleteTransaction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('tx1');
    });

    expect(apiDeleteV1).toHaveBeenCalled();
    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(queryKeys.dashboard.all);
  });

  it('invalidates dashboard queries on void', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useVoidTransaction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('tx1');
    });

    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(queryKeys.dashboard.all);
  });

  it('invalidates dashboard queries on bulk create', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useCreateBulkTransaction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        type: 'EXPENSE',
        merchant: 'Sri Ganesh Grocers',
        date: '2026-07-19',
        budgetPeriodYear: 2026,
        budgetPeriodMonth: 7,
        paymentSourceId: 'acc1',
        paymentMethod: 'UPI',
        items: [
          { categoryId: 'meat', amount: 805 },
          { categoryId: 'milk', amount: 384 },
        ],
      });
    });

    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).toContainEqual(queryKeys.dashboard.all);
    expect(keys).toContainEqual(queryKeys.budget.all);
  });
});

describe('useCreateBulkTransaction', () => {
  it('posts to the bulk endpoint with an idempotency key', async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useCreateBulkTransaction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        type: 'EXPENSE',
        merchant: 'Sri Ganesh Grocers',
        date: '2026-07-19',
        budgetPeriodYear: 2026,
        budgetPeriodMonth: 7,
        paymentSourceId: 'acc1',
        paymentMethod: 'UPI',
        items: [{ categoryId: 'meat', amount: 805 }],
      });
    });

    expect(apiPostV1).toHaveBeenCalledWith(
      '/api/v1/transactions/bulk',
      expect.objectContaining({ items: [{ categoryId: 'meat', amount: 805 }] }),
      expect.objectContaining({ 'X-Idempotency-Key': expect.any(String) }),
    );
  });

  it('does NOT invalidate accounts (bulk items are always EXPENSE, never TRANSFER)', async () => {
    const { wrapper, invalidateSpy } = makeWrapper();
    const { result } = renderHook(() => useCreateBulkTransaction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        type: 'EXPENSE',
        merchant: 'Sri Ganesh Grocers',
        date: '2026-07-19',
        budgetPeriodYear: 2026,
        budgetPeriodMonth: 7,
        paymentSourceId: 'acc1',
        paymentMethod: 'UPI',
        items: [{ categoryId: 'meat', amount: 805 }],
      });
    });

    const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
    expect(keys).not.toContainEqual(queryKeys.accounts.all);
  });
});
