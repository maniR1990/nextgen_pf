'use client';

import { useToast } from '@/components/common/ToastProvider/useToast';
import type { TxType } from '@/constants/finance';
import { TX_TYPE_META } from '@/constants/finance';
import {
  useCreateBulkTransaction,
  useCreateTransaction,
  usePatchTransaction,
} from '@/hooks/useTransactions';
import type { BulkTransactionBody, TransactionBody } from '@/hooks/useTransactions';
import { CreateTransactionSchema } from '@/modules/transactions/transactions.schema';
import { useTransactionFormStore } from '@/store/transactionFormStore';
import type { FormErrors, SuccessData } from '@/store/transactionFormStore';
import { useCallback } from 'react';

// ── Body builder ──────────────────────────────────────────────────────────────

/**
 * Maps Zustand form values → API body.
 * Extracted so create and update share exactly the same shape.
 */
export function buildTransactionBody(
  values: ReturnType<typeof useTransactionFormStore.getState>['values'],
): TransactionBody {
  const amountNum = Number.parseFloat(values.amount);
  return {
    type: values.type,
    date: values.date,
    budgetPeriodYear: values.budgetPeriodYear,
    budgetPeriodMonth: values.budgetPeriodMonth,
    amount: amountNum,
    merchant: values.merchant || undefined,
    categoryId: values.categoryId || undefined,
    paymentSourceId: values.sourceId,
    toAccountId: values.toAccountId || undefined,
    paymentMethod: values.method,
    isPlanned: values.isPlanned,
    isRecurring: values.isRecurring,
    notes: values.notes || undefined,
    tags: values.tags
      ? values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    // Investment
    assetClass: values.assetClass || undefined,
    fundName: values.fundName || undefined,
    units: values.units ? Number.parseFloat(values.units) : undefined,
    nav: values.nav ? Number.parseFloat(values.nav) : undefined,
    mfPlan: values.mfPlan || undefined,
    taxSection: values.taxSection || undefined,
    // Income
    incomeType: values.incomeType || undefined,
    tds: values.tds ? Number.parseFloat(values.tds) : undefined,
    // Gift
    giftFrom: values.giftFrom || undefined,
    occasion: values.occasion || undefined,
    // Sinking / fund purpose-tag
    fundId: values.fundId || undefined,
    fundFlow: values.fundFlow || undefined,
    // Expense extras
    isTaxDed: values.isTaxDed || undefined,
    isReimbursable: values.isReimbursable || undefined,
    reimbDate: values.reimbDate || undefined,
    // Reimbursement
    reimbFrom: values.reimbFrom || undefined,
    origTxRef: values.origTxRef || undefined,
    // Transfer
    txPurpose: values.txPurpose || undefined,
    txFee: values.txFee ? Number.parseFloat(values.txFee) : undefined,
    // ATM
    atmLocation: values.atmLocation || undefined,
    atmPurpose: values.atmPurpose || undefined,
    // Refund
    refundReason: values.refundReason || undefined,
    // Coupon
    origPrice: values.origPrice ? Number.parseFloat(values.origPrice) : undefined,
    couponCode: values.couponCode || undefined,
    platform: values.platform || undefined,
    // Points
    ptsSpent: values.ptsSpent ? Number.parseFloat(values.ptsSpent) : undefined,
    ptsRate: values.ptsRate ? Number.parseFloat(values.ptsRate) : undefined,
    // Recurring
    recSchedule: values.isRecurring
      ? {
          frequency: values.recFrequency,
          every: Number.parseInt(values.recEvery) || 1,
          endCondition: values.recEndCondition,
          count: values.recCount ? Number.parseInt(values.recCount) : undefined,
          endDate: values.recEndDate || undefined,
        }
      : undefined,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useTransactionForm(editId?: string) {
  const store = useTransactionFormStore();
  const toast = useToast();

  // Mutations — invalidation is handled inside each mutation's onSuccess/onError.
  // This hook only drives Zustand store state (UI: loading, success, errors).
  const createTx = useCreateTransaction();
  const createBulkTx = useCreateBulkTransaction();
  const patchTx = usePatchTransaction(editId ?? '');

  const handleTypeChange = useCallback((type: TxType) => store.setType(type), [store]);

  const handleFieldChange = useCallback(
    <K extends keyof typeof store.values>(key: K, value: (typeof store.values)[K]) => {
      store.setField(key, value);

      // Auto-derive budget period from date
      if (key === 'date') {
        const d = new Date(value as string);
        if (!Number.isNaN(d.getTime())) {
          const isIncome = ['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT'].includes(store.values.type);
          const budgetMonth = isIncome ? d.getMonth() + 2 : d.getMonth() + 1;
          const budgetYear = isIncome && budgetMonth > 12 ? d.getFullYear() + 1 : d.getFullYear();
          store.setField('budgetPeriodYear', budgetYear);
          store.setField('budgetPeriodMonth', budgetMonth > 12 ? 1 : budgetMonth);
        }
      }

      // Auto-calc amount from units × nav for investments
      if (key === 'units' || key === 'nav') {
        const units = Number.parseFloat(key === 'units' ? (value as string) : store.values.units);
        const nav = Number.parseFloat(key === 'nav' ? (value as string) : store.values.nav);
        if (!Number.isNaN(units) && !Number.isNaN(nav) && units > 0 && nav > 0) {
          store.setField('amount', String((units * nav).toFixed(2)));
        }
      }

      // Auto-calc amount from pts × rate for points redemption
      if (key === 'ptsSpent' || key === 'ptsRate') {
        const pts = Number.parseFloat(
          key === 'ptsSpent' ? (value as string) : store.values.ptsSpent,
        );
        const rate = Number.parseFloat(
          key === 'ptsRate' ? (value as string) : store.values.ptsRate,
        );
        if (!Number.isNaN(pts) && !Number.isNaN(rate) && pts > 0 && rate > 0) {
          store.setField('amount', String((pts * rate).toFixed(2)));
        }
      }
    },
    [store],
  );

  const validate = useCallback((): FormErrors => {
    const { values } = store;
    const amountNum = Number.parseFloat(values.amount);
    const errors: FormErrors = {};

    const result = CreateTransactionSchema.safeParse({
      userId: 'validation-only',
      type: values.type,
      date: values.date,
      budgetPeriodYear: values.budgetPeriodYear,
      budgetPeriodMonth: values.budgetPeriodMonth,
      amount: Number.isNaN(amountNum) ? 0 : amountNum,
      paymentSourceId: values.sourceId,
      paymentMethod: values.method,
      isPlanned: values.isPlanned,
      isRecurring: values.isRecurring,
      merchant: values.merchant || undefined,
      categoryId: values.categoryId || undefined,
      toAccountId: values.toAccountId || undefined,
      incomeType: values.incomeType || undefined,
      assetClass: values.assetClass || undefined,
      fundId: values.fundId || undefined,
      fundFlow: values.fundFlow || undefined,
      recSchedule: values.isRecurring
        ? {
            frequency: values.recFrequency,
            every: Number.parseInt(values.recEvery) || 1,
            endCondition: values.recEndCondition,
            count: values.recCount ? Number.parseInt(values.recCount) : undefined,
            endDate: values.recEndDate || undefined,
          }
        : undefined,
    });

    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string;
        const fieldMap: Record<string, keyof typeof values> = {
          paymentSourceId: 'sourceId',
          paymentMethod: 'method',
        };
        const formKey = (fieldMap[path] ?? path) as keyof typeof values;
        if (!errors[formKey]) errors[formKey] = issue.message;
      }
    }

    return errors;
  }, [store]);

  // ── Submit (create, bulk) ────────────────────────────────────────────────────
  // One bill, many items — merchant/date/account/method are shared, only
  // categoryId + amount vary per item. Validated separately from the single-
  // transaction path since it has no per-item fields in CreateTransactionSchema.

  const handleBulkSubmit = useCallback(async (): Promise<boolean> => {
    const { values, items } = store;
    const invalidIds = items
      .filter((it) => !it.categoryId || !(Number.parseFloat(it.amount) > 0))
      .map((it) => it.id);

    const sharedErrors: FormErrors = {};
    if (!values.merchant.trim()) sharedErrors.merchant = 'Merchant or description is required';
    if (!values.sourceId) sharedErrors.sourceId = 'Payment source required';
    if (items.length === 0) {
      sharedErrors._form = 'Add at least one item';
    } else if (invalidIds.length > 0) {
      sharedErrors._form = 'Every item needs a category and an amount';
    }

    if (Object.keys(sharedErrors).length > 0) {
      store.setErrors(sharedErrors);
      store.setInvalidItemIds(invalidIds);
      return false;
    }
    store.setInvalidItemIds([]);
    store.setSubmitState('loading');

    try {
      const body: BulkTransactionBody = {
        type: 'EXPENSE',
        merchant: values.merchant,
        date: values.date,
        budgetPeriodYear: values.budgetPeriodYear,
        budgetPeriodMonth: values.budgetPeriodMonth,
        paymentSourceId: values.sourceId,
        paymentMethod: values.method,
        notes: values.notes || undefined,
        tags: values.tags
          ? values.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        items: items.map((it) => ({
          categoryId: it.categoryId,
          amount: Number.parseFloat(it.amount),
        })),
      };
      const created = await createBulkTx.mutateAsync(body);

      const total = items.reduce((sum, it) => sum + (Number.parseFloat(it.amount) || 0), 0);
      const d = new Date(values.date);
      const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

      store.setSuccessData({
        amount: `₹${total.toLocaleString('en-IN')}`,
        merchant: `${values.merchant} · ${items.length} item${items.length > 1 ? 's' : ''}`,
        type: 'EXPENSE',
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        method: values.method,
        budgetPeriodLabel: `${monthLabel} budget`,
        // Item labels come from the server's response (real category names), not the
        // client's picker state — the response is the authoritative record of what was
        // actually saved, and it's already fetched here for free.
        items: created.map((row) => ({
          label: row.category?.name ?? 'Uncategorized',
          amount: `₹${row.amount.toLocaleString('en-IN')}`,
        })),
      });
      store.setSubmitState('success');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setErrors({ _form: message });
      store.setSubmitState('error');
      return false;
    }
  }, [store, createBulkTx]);

  // ── Submit (create) ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    if (store.isMultiItem) return handleBulkSubmit();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      store.setErrors(errors);
      return false;
    }

    store.setSubmitState('loading');

    try {
      const { values } = store;
      const body = buildTransactionBody(values);
      await createTx.mutateAsync(body);

      const amountNum = Number.parseFloat(values.amount);
      const typeMeta = TX_TYPE_META[values.type];
      const d = new Date(values.date);
      const monthLabel = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });

      const successData: SuccessData = {
        amount: `₹${amountNum.toLocaleString('en-IN')}`,
        merchant: values.merchant || typeMeta.label,
        type: values.type,
        date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        method: values.method,
        budgetPeriodLabel: `${monthLabel} budget`,
      };

      store.setSuccessData(successData);
      store.setSubmitState('success');
      return true;
    } catch (err) {
      // useCreateTransaction's onError already showed a toast — just update form state
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setErrors({ _form: message });
      store.setSubmitState('error');
      return false;
    }
  }, [store, validate, createTx]);

  // ── Update (edit) ───────────────────────────────────────────────────────────

  const handleUpdate = useCallback(async (): Promise<boolean> => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      store.setErrors(errors);
      return false;
    }

    store.setSubmitState('loading');

    try {
      const body = buildTransactionBody(store.values);
      await patchTx.mutateAsync(body);

      store.setSubmitState('success');
      toast.success('Transaction updated');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setErrors({ _form: message });
      store.setSubmitState('error');
      return false;
    }
  }, [store, validate, patchTx, toast]);

  // ── Log another — preserve account + method context ─────────────────────────

  const handleLogAnother = useCallback(() => {
    const { values } = store;
    store.reset();
    store.setField('type', values.type);
    store.setField('sourceId', values.sourceId);
    store.setField('method', values.method);
  }, [store]);

  return {
    values: store.values,
    errors: store.errors,
    submitState: store.submitState,
    successData: store.successData,
    isDuplicateDismissed: store.isDuplicateDismissed,
    isMultiItem: store.isMultiItem,
    items: store.items,
    isSubmitting: createTx.isPending || createBulkTx.isPending || patchTx.isPending,
    handleTypeChange,
    handleFieldChange,
    handleSubmit,
    handleUpdate,
    handleLogAnother,
    dismissDuplicate: store.dismissDuplicate,
    reset: store.reset,
    prefill: store.prefill,
  };
}
