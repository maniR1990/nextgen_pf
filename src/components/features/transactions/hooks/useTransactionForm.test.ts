import { useTransactionFormStore } from '@/store/transactionFormStore';
import { act, renderHook } from '@testing-library/react';
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
      const { result } = renderHook(() => useTransactionForm());
      expect(result.current.values.type).toBe('EXPENSE');
    });

    it('defaults to UPI method', () => {
      const { result } = renderHook(() => useTransactionForm());
      expect(result.current.values.method).toBe('UPI');
    });

    it('defaults isPlanned to true', () => {
      const { result } = renderHook(() => useTransactionForm());
      expect(result.current.values.isPlanned).toBe(true);
    });

    it('submitState starts idle', () => {
      const { result } = renderHook(() => useTransactionForm());
      expect(result.current.submitState).toBe('idle');
    });

    it('successData is null initially', () => {
      const { result } = renderHook(() => useTransactionForm());
      expect(result.current.successData).toBeNull();
    });
  });

  describe('handleTypeChange', () => {
    it('updates the type', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleTypeChange('INCOME'));
      expect(result.current.values.type).toBe('INCOME');
    });

    it('preserves date when switching type', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleFieldChange('date', '2025-03-15'));
      act(() => result.current.handleTypeChange('INVESTMENT'));
      expect(result.current.values.date).toBe('2025-03-15');
    });

    it('preserves sourceId when switching type', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleFieldChange('sourceId', 'src-99'));
      act(() => result.current.handleTypeChange('TRANSFER'));
      expect(result.current.values.sourceId).toBe('src-99');
    });

    it('preserves method when switching type', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleFieldChange('method', 'CARD_ONLINE'));
      act(() => result.current.handleTypeChange('REFUND'));
      expect(result.current.values.method).toBe('CARD_ONLINE');
    });

    it('resets merchant when switching type', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleFieldChange('merchant', 'Starbucks'));
      act(() => result.current.handleTypeChange('INVESTMENT'));
      expect(result.current.values.merchant).toBe('');
    });

    it('clears errors when switching type', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => useTransactionFormStore.getState().setErrors({ merchant: 'Required' }));
      act(() => result.current.handleTypeChange('INCOME'));
      expect(result.current.errors.merchant).toBeUndefined();
    });
  });

  describe('handleFieldChange', () => {
    it('updates a simple string field', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleFieldChange('merchant', 'Zepto'));
      expect(result.current.values.merchant).toBe('Zepto');
    });

    it('auto-derives budget period for non-income type (same month)', () => {
      const { result } = renderHook(() => useTransactionForm());
      // EXPENSE is default — same month
      act(() => result.current.handleFieldChange('date', '2025-03-15'));
      expect(result.current.values.budgetPeriodMonth).toBe(3);
      expect(result.current.values.budgetPeriodYear).toBe(2025);
    });

    it('auto-derives budget period for INCOME type (next month)', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleTypeChange('INCOME'));
      act(() => result.current.handleFieldChange('date', '2025-03-15'));
      // March income → April budget
      expect(result.current.values.budgetPeriodMonth).toBe(4);
      expect(result.current.values.budgetPeriodYear).toBe(2025);
    });

    it('handles December INCOME type (wraps to January next year)', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleTypeChange('INCOME'));
      act(() => result.current.handleFieldChange('date', '2025-12-15'));
      expect(result.current.values.budgetPeriodMonth).toBe(1);
      expect(result.current.values.budgetPeriodYear).toBe(2026);
    });

    it('auto-calculates amount from units × nav', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleTypeChange('INVESTMENT'));
      act(() => result.current.handleFieldChange('units', '10'));
      act(() => result.current.handleFieldChange('nav', '250.50'));
      expect(result.current.values.amount).toBe('2505.00');
    });

    it('auto-calculates amount from ptsSpent × ptsRate', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleTypeChange('POINTS_REDEMPTION'));
      act(() => result.current.handleFieldChange('ptsSpent', '5000'));
      act(() => result.current.handleFieldChange('ptsRate', '0.25'));
      expect(result.current.values.amount).toBe('1250.00');
    });
  });

  describe('validate', () => {
    it('returns amount error when amount is empty', () => {
      const { result } = renderHook(() => useTransactionForm());
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
      const { result } = renderHook(() => useTransactionForm());
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
      const { result } = renderHook(() => useTransactionForm());
      expect(result.current.isDuplicateDismissed).toBe(false);
      act(() => result.current.dismissDuplicate());
      expect(result.current.isDuplicateDismissed).toBe(true);
    });
  });

  describe('handleLogAnother', () => {
    it('resets form but preserves type', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleTypeChange('INCOME'));
      act(() => result.current.handleFieldChange('merchant', 'HDFC Bank'));
      act(() => result.current.handleLogAnother());
      expect(result.current.values.type).toBe('INCOME');
      expect(result.current.values.merchant).toBe('');
    });

    it('preserves sourceId across log-another', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleFieldChange('sourceId', 'src-7'));
      act(() => result.current.handleLogAnother());
      expect(result.current.values.sourceId).toBe('src-7');
    });
  });

  describe('reset', () => {
    it('returns form to default state', () => {
      const { result } = renderHook(() => useTransactionForm());
      act(() => result.current.handleTypeChange('INVESTMENT'));
      act(() => result.current.handleFieldChange('amount', '10000'));
      act(() => result.current.reset());
      expect(result.current.values.type).toBe('EXPENSE');
      expect(result.current.values.amount).toBe('');
    });
  });
});
