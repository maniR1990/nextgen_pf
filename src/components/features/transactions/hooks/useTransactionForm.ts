'use client';

import { useToast } from '@/components/common/ToastProvider/useToast';
import type { TxType } from '@/constants/finance';
import { TX_TYPE_META } from '@/constants/finance';
import { CreateTransactionSchema } from '@/modules/transactions/transactions.schema';
import { useTransactionFormStore } from '@/store/transactionFormStore';
import type { FormErrors, SuccessData } from '@/store/transactionFormStore';
import { useCallback } from 'react';

export function useTransactionForm() {
  const store = useTransactionFormStore();
  const toast = useToast();

  const handleTypeChange = useCallback((type: TxType) => store.setType(type), [store]);

  const handleFieldChange = useCallback(
    <K extends keyof typeof store.values>(key: K, value: (typeof store.values)[K]) => {
      store.setField(key, value);

      // Auto-derive budget period from date
      if (key === 'date') {
        const d = new Date(value as string);
        if (!isNaN(d.getTime())) {
          const isIncome = ['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT'].includes(store.values.type);
          // Income received in month N funds budget month N+1
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
        if (!isNaN(units) && !isNaN(nav) && units > 0 && nav > 0) {
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
        if (!isNaN(pts) && !isNaN(rate) && pts > 0 && rate > 0) {
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
      userId: 'validation-only', // placeholder — real userId added server-side
      type: values.type,
      date: values.date,
      budgetPeriodYear: values.budgetPeriodYear,
      budgetPeriodMonth: values.budgetPeriodMonth,
      amount: isNaN(amountNum) ? 0 : amountNum,
      paymentSourceId: values.sourceId,
      paymentMethod: values.method,
      isPlanned: values.isPlanned,
      isRecurring: values.isRecurring,
      merchant: values.merchant || undefined,
      categoryId: values.categoryId || undefined,
      toAccountId: values.toAccountId || undefined,
      incomeType: values.incomeType || undefined,
      assetClass: values.assetClass || undefined,
      sfId: values.sfId || undefined,
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
        // Map schema field names → form field names
        const fieldMap: Record<string, keyof typeof values> = {
          paymentSourceId: 'sourceId',
          paymentMethod: 'method',
        };
        const formKey = (fieldMap[path] ?? path) as keyof typeof values;
        if (!errors[formKey]) {
          errors[formKey] = issue.message;
        }
      }
    }

    return errors;
  }, [store]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      store.setErrors(errors);
      return false;
    }

    store.setSubmitState('loading');

    try {
      const { values } = store;
      const amountNum = Number.parseFloat(values.amount);

      const body = {
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
        // Sinking
        sfId: values.sfId || undefined,
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

      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/v1/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message ?? json.error ?? 'Failed to log transaction');
      }

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
      const message = err instanceof Error ? err.message : 'Something went wrong';
      store.setErrors({ _form: message });
      store.setSubmitState('error');
      toast.error(message);
      return false;
    }
  }, [store, validate, toast]);

  const handleUpdate = useCallback(
    async (editId: string): Promise<boolean> => {
      const errors = validate();
      if (Object.keys(errors).length > 0) {
        store.setErrors(errors);
        return false;
      }

      store.setSubmitState('loading');

      try {
        const { values } = store;
        const amountNum = Number.parseFloat(values.amount);

        const body = {
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
          assetClass: values.assetClass || undefined,
          fundName: values.fundName || undefined,
          units: values.units ? Number.parseFloat(values.units) : undefined,
          nav: values.nav ? Number.parseFloat(values.nav) : undefined,
          mfPlan: values.mfPlan || undefined,
          taxSection: values.taxSection || undefined,
          incomeType: values.incomeType || undefined,
          tds: values.tds ? Number.parseFloat(values.tds) : undefined,
          giftFrom: values.giftFrom || undefined,
          occasion: values.occasion || undefined,
          sfId: values.sfId || undefined,
          isTaxDed: values.isTaxDed || undefined,
          isReimbursable: values.isReimbursable || undefined,
          reimbDate: values.reimbDate || undefined,
          reimbFrom: values.reimbFrom || undefined,
          origTxRef: values.origTxRef || undefined,
          txPurpose: values.txPurpose || undefined,
          txFee: values.txFee ? Number.parseFloat(values.txFee) : undefined,
          atmLocation: values.atmLocation || undefined,
          atmPurpose: values.atmPurpose || undefined,
          refundReason: values.refundReason || undefined,
          origPrice: values.origPrice ? Number.parseFloat(values.origPrice) : undefined,
          couponCode: values.couponCode || undefined,
          platform: values.platform || undefined,
          ptsSpent: values.ptsSpent ? Number.parseFloat(values.ptsSpent) : undefined,
          ptsRate: values.ptsRate ? Number.parseFloat(values.ptsRate) : undefined,
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

        const res = await fetch(`/api/v1/transactions/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error?.message ?? json.error ?? 'Failed to update transaction');
        }

        store.setSubmitState('success');
        toast.success('Transaction updated');
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        store.setErrors({ _form: message });
        store.setSubmitState('error');
        toast.error(message);
        return false;
      }
    },
    [store, validate, toast],
  );

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
