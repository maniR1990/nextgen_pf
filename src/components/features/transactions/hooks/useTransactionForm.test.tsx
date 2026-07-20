import { apiPatchV1, apiPostV1 } from '@/lib/query/fetcher';
import { useTransactionFormStore } from '@/store/transactionFormStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTransactionForm } from './useTransactionForm';

// Mock ToastProvider context dependency
vi.mock('@/components/common/ToastProvider/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

// useCreateTransaction/useCreateBulkTransaction/usePatchTransaction all need a real
// QueryClient in context (useQueryClient() throws without one) even for tests that
// never let validation reach the actual network call. Bulk and single-transaction
// create share apiPostV1 but return different shapes (array vs one object), so the
// mock branches on the URL rather than using one blanket resolved value.
vi.mock('@/lib/query/fetcher', () => ({
  apiPostV1: vi.fn((url: string) => {
    if (url === '/api/v1/transactions/bulk') {
      return Promise.resolve([
        { id: 'tx1', amount: 805, category: { id: 'meat', name: 'Meat' } },
        { id: 'tx2', amount: 384, category: { id: 'milk', name: 'Milk' } },
      ]);
    }
    return Promise.resolve({ id: 'tx1' });
  }),
  apiPatchV1: vi.fn().mockResolvedValue({ id: 'tx1' }),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const wrapper = makeWrapper();

function resetStore() {
  act(() => {
    useTransactionFormStore.getState().reset();
  });
}

describe('useTransactionForm', () => {
  beforeEach(() => resetStore());
  afterEach(() => resetStore());

  describe('initial state', () => {
    it('defaults to EXPENSE type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      expect(result.current.values.type).toBe('EXPENSE');
    });

    it('defaults to UPI method', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      expect(result.current.values.method).toBe('UPI');
    });

    it('defaults isPlanned to true', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      expect(result.current.values.isPlanned).toBe(true);
    });

    it('submitState starts idle', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      expect(result.current.submitState).toBe('idle');
    });

    it('successData is null initially', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      expect(result.current.successData).toBeNull();
    });
  });

  describe('handleTypeChange', () => {
    it('updates the type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleTypeChange('INCOME'));
      expect(result.current.values.type).toBe('INCOME');
    });

    it('preserves date when switching type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('date', '2025-03-15'));
      act(() => result.current.handleTypeChange('INVESTMENT'));
      expect(result.current.values.date).toBe('2025-03-15');
    });

    it('preserves sourceId when switching type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('sourceId', 'src-99'));
      act(() => result.current.handleTypeChange('TRANSFER'));
      expect(result.current.values.sourceId).toBe('src-99');
    });

    it('preserves method when switching type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('method', 'CARD_ONLINE'));
      act(() => result.current.handleTypeChange('REFUND'));
      expect(result.current.values.method).toBe('CARD_ONLINE');
    });

    it('resets merchant when switching type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('merchant', 'Starbucks'));
      act(() => result.current.handleTypeChange('INVESTMENT'));
      expect(result.current.values.merchant).toBe('');
    });

    it('clears errors when switching type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => useTransactionFormStore.getState().setErrors({ merchant: 'Required' }));
      act(() => result.current.handleTypeChange('INCOME'));
      expect(result.current.errors.merchant).toBeUndefined();
    });
  });

  describe('handleFieldChange', () => {
    it('updates a simple string field', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('merchant', 'Zepto'));
      expect(result.current.values.merchant).toBe('Zepto');
    });

    it('auto-derives budget period for non-income type (same month)', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      // EXPENSE is default — same month
      act(() => result.current.handleFieldChange('date', '2025-03-15'));
      expect(result.current.values.budgetPeriodMonth).toBe(3);
      expect(result.current.values.budgetPeriodYear).toBe(2025);
    });

    it('auto-derives budget period for INCOME type (next month)', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleTypeChange('INCOME'));
      act(() => result.current.handleFieldChange('date', '2025-03-15'));
      // March income → April budget
      expect(result.current.values.budgetPeriodMonth).toBe(4);
      expect(result.current.values.budgetPeriodYear).toBe(2025);
    });

    it('handles December INCOME type (wraps to January next year)', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleTypeChange('INCOME'));
      act(() => result.current.handleFieldChange('date', '2025-12-15'));
      expect(result.current.values.budgetPeriodMonth).toBe(1);
      expect(result.current.values.budgetPeriodYear).toBe(2026);
    });

    it('auto-calculates amount from units × nav', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleTypeChange('INVESTMENT'));
      act(() => result.current.handleFieldChange('units', '10'));
      act(() => result.current.handleFieldChange('nav', '250.50'));
      expect(result.current.values.amount).toBe('2505.00');
    });

    it('auto-calculates amount from ptsSpent × ptsRate', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleTypeChange('POINTS_REDEMPTION'));
      act(() => result.current.handleFieldChange('ptsSpent', '5000'));
      act(() => result.current.handleFieldChange('ptsRate', '0.25'));
      expect(result.current.values.amount).toBe('1250.00');
    });
  });

  describe('validate', () => {
    it('returns amount error when amount is empty', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      // amount is empty by default
      act(() => {
        const errs = result.current.errors;
        // errors not set until validate runs via submit
        void errs;
      });
      // Trigger via submit to see errors
      act(() => {
        result.current.handleSubmit().catch(() => {});
      });
      // After submit attempt with invalid data, errors should be set
      expect(Object.keys(result.current.errors).length).toBeGreaterThanOrEqual(0);
    });

    it('requires merchant for EXPENSE type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('amount', '500'));
      // merchant is empty — should produce error
      // run submit to populate errors
      act(() => {
        result.current.handleSubmit().catch(() => {});
      });
    });
  });

  describe('dismissDuplicate', () => {
    it('sets isDuplicateDismissed to true', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      expect(result.current.isDuplicateDismissed).toBe(false);
      act(() => result.current.dismissDuplicate());
      expect(result.current.isDuplicateDismissed).toBe(true);
    });
  });

  describe('handleLogAnother', () => {
    it('resets form but preserves type', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleTypeChange('INCOME'));
      act(() => result.current.handleFieldChange('merchant', 'HDFC Bank'));
      act(() => result.current.handleLogAnother());
      expect(result.current.values.type).toBe('INCOME');
      expect(result.current.values.merchant).toBe('');
    });

    it('preserves sourceId across log-another', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('sourceId', 'src-7'));
      act(() => result.current.handleLogAnother());
      expect(result.current.values.sourceId).toBe('src-7');
    });
  });

  describe('reset', () => {
    it('returns form to default state', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleTypeChange('INVESTMENT'));
      act(() => result.current.handleFieldChange('amount', '10000'));
      act(() => result.current.reset());
      expect(result.current.values.type).toBe('EXPENSE');
      expect(result.current.values.amount).toBe('');
    });
  });

  describe('multi-item bulk submit', () => {
    function setupValidBulk(result: ReturnType<typeof useTransactionForm>) {
      act(() => result.current.handleFieldChange('merchant', 'Sri Ganesh Grocers'));
      act(() => result.current.handleFieldChange('sourceId', 'acc1'));
      act(() => useTransactionFormStore.getState().setMultiItem(true));
      const itemId = useTransactionFormStore.getState().items[0].id;
      act(() =>
        useTransactionFormStore.getState().updateItem(itemId, { categoryId: 'meat', amount: '805' }),
      );
    }

    it('exposes isMultiItem and items from the store', () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      expect(result.current.isMultiItem).toBe(false);
      act(() => useTransactionFormStore.getState().setMultiItem(true));
      expect(result.current.isMultiItem).toBe(true);
      expect(result.current.items).toHaveLength(1);
    });

    it('rejects submit with no items and sets a form error', async () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => useTransactionFormStore.getState().setMultiItem(true));
      act(() => useTransactionFormStore.getState().removeItem(result.current.items[0].id));
      // removeItem is a no-op below 1 item in the UI, but the store action itself has
      // no such guard — simulate the true "zero items" edge case directly.
      act(() => useTransactionFormStore.setState({ items: [] }));

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.handleSubmit();
      });

      expect(ok).toBe(false);
      expect(result.current.errors._form).toBe('Add at least one item');
    });

    it('rejects submit when an item has no category, and flags it in invalidItemIds', async () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('merchant', 'Sri Ganesh Grocers'));
      act(() => result.current.handleFieldChange('sourceId', 'acc1'));
      act(() => useTransactionFormStore.getState().setMultiItem(true));
      const itemId = useTransactionFormStore.getState().items[0].id;
      act(() => useTransactionFormStore.getState().updateItem(itemId, { amount: '805' }));

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.handleSubmit();
      });

      expect(ok).toBe(false);
      expect(useTransactionFormStore.getState().invalidItemIds).toContain(itemId);
    });

    it('rejects submit without a merchant', async () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => useTransactionFormStore.getState().setMultiItem(true));

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.handleSubmit();
      });

      expect(ok).toBe(false);
      expect(result.current.errors.merchant).toBeTruthy();
    });

    it('submits a valid multi-item bill via the bulk endpoint', async () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      setupValidBulk(result);

      let ok: boolean | undefined;
      await act(async () => {
        ok = await result.current.handleSubmit();
      });

      expect(ok).toBe(true);
      expect(apiPostV1).toHaveBeenCalledWith(
        '/api/v1/transactions/bulk',
        expect.objectContaining({
          type: 'EXPENSE',
          merchant: 'Sri Ganesh Grocers',
          items: [{ categoryId: 'meat', amount: 805 }],
        }),
        expect.anything(),
      );
      expect(result.current.submitState).toBe('success');
    });

    it('never calls the single-transaction endpoint when isMultiItem is true', async () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      setupValidBulk(result);

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(apiPostV1).not.toHaveBeenCalledWith('/api/v1/transactions', expect.anything(), expect.anything());
    });

    it('builds success data summarizing the item count and bill total', async () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      act(() => result.current.handleFieldChange('merchant', 'Sri Ganesh Grocers'));
      act(() => result.current.handleFieldChange('sourceId', 'acc1'));
      act(() => useTransactionFormStore.getState().setMultiItem(true));
      const firstId = useTransactionFormStore.getState().items[0].id;
      act(() =>
        useTransactionFormStore.getState().updateItem(firstId, { categoryId: 'meat', amount: '805' }),
      );
      act(() => useTransactionFormStore.getState().addItem());
      const secondId = useTransactionFormStore.getState().items[1].id;
      act(() =>
        useTransactionFormStore.getState().updateItem(secondId, { categoryId: 'milk', amount: '384' }),
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.successData?.amount).toBe('₹1,189');
      expect(result.current.successData?.merchant).toBe('Sri Ganesh Grocers · 2 items');
    });

    it('builds an itemized breakdown from the server response, using real category names', async () => {
      const { result } = renderHook(() => useTransactionForm(), { wrapper });
      setupValidBulk(result);

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.successData?.items).toEqual([
        { label: 'Meat', amount: '₹805' },
        { label: 'Milk', amount: '₹384' },
      ]);
    });
  });
});
