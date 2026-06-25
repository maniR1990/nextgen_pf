'use client';

import type { TxType } from '@/constants/finance';
import { createAppStore } from '@/lib/stores/createStore';

export interface TransactionFormValues {
  // Core
  type: TxType;
  date: string;
  amount: string;
  merchant: string;
  categoryId: string;
  sourceId: string;
  toAccountId: string;
  method: string;
  isPlanned: boolean;
  isRecurring: boolean;
  notes: string;
  tags: string;
  budgetPeriodYear: number;
  budgetPeriodMonth: number;

  // Investment
  assetClass: string;
  fundName: string;
  units: string;
  nav: string;
  mfPlan: string;
  taxSection: string;

  // Income
  incomeType: string;
  tds: string;

  // Gift
  giftFrom: string;
  occasion: string;

  // Sinking deposit
  sfId: string;

  // Expense extras
  isTaxDed: boolean;
  isReimbursable: boolean;
  reimbDate: string;

  // Reimbursement
  reimbFrom: string;
  origTxRef: string;

  // Transfer
  txPurpose: string;
  txFee: string;

  // ATM
  atmLocation: string;
  atmPurpose: string;

  // Refund
  refundReason: string;

  // Coupon
  origPrice: string;
  couponCode: string;
  platform: string;

  // Points
  ptsSpent: string;
  ptsRate: string;

  // Recurring
  recFrequency: string;
  recEvery: string;
  recEndCondition: 'forever' | 'count' | 'date';
  recCount: string;
  recEndDate: string;
}

export type FormErrors = Partial<Record<keyof TransactionFormValues | '_form', string>>;

export type SubmitState = 'idle' | 'loading' | 'success' | 'error';

export interface SuccessData {
  amount: string;
  merchant: string;
  type: TxType;
  categoryLabel?: string;
  date: string;
  method: string;
  budgetPeriodLabel: string;
}

const now = new Date();

function buildDefaultValues(): TransactionFormValues {
  // toISOString() is UTC — for IST users near midnight this gives yesterday. Use local date instead.
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return {
    type: 'EXPENSE',
    date: today,
    amount: '',
    merchant: '',
    categoryId: '',
    sourceId: '',
    toAccountId: '',
    method: 'UPI',
    isPlanned: true,
    isRecurring: false,
    notes: '',
    tags: '',
    budgetPeriodYear: now.getFullYear(),
    budgetPeriodMonth: now.getMonth() + 1,
    assetClass: '',
    fundName: '',
    units: '',
    nav: '',
    mfPlan: 'growth',
    taxSection: '',
    incomeType: '',
    tds: '',
    giftFrom: '',
    occasion: '',
    sfId: '',
    isTaxDed: false,
    isReimbursable: false,
    reimbDate: '',
    reimbFrom: '',
    origTxRef: '',
    txPurpose: '',
    txFee: '',
    atmLocation: '',
    atmPurpose: '',
    refundReason: '',
    origPrice: '',
    couponCode: '',
    platform: '',
    ptsSpent: '',
    ptsRate: '',
    recFrequency: 'MONTHLY',
    recEvery: '1',
    recEndCondition: 'forever',
    recCount: '',
    recEndDate: '',
  };
}

interface TransactionFormState {
  values: TransactionFormValues;
  errors: FormErrors;
  submitState: SubmitState;
  successData: SuccessData | null;
  isDuplicateDismissed: boolean;

  setField: <K extends keyof TransactionFormValues>(
    key: K,
    value: TransactionFormValues[K],
  ) => void;
  setType: (type: TxType) => void;
  prefill: (vals: Partial<TransactionFormValues>) => void;
  setErrors: (errors: FormErrors) => void;
  clearError: (key: keyof FormErrors) => void;
  setSubmitState: (state: SubmitState) => void;
  setSuccessData: (data: SuccessData | null) => void;
  dismissDuplicate: () => void;
  reset: () => void;
}

export const useTransactionFormStore = createAppStore<TransactionFormState>(
  'transactionForm',
  (set) => ({
    values: buildDefaultValues(),
    errors: {},
    submitState: 'idle',
    successData: null,
    isDuplicateDismissed: false,

    setField: (key, value) =>
      set((s) => ({
        values: { ...s.values, [key]: value },
        errors: { ...s.errors, [key]: undefined },
      })),

    setType: (type) =>
      set((s) => ({
        values: {
          ...buildDefaultValues(),
          type,
          date: s.values.date,
          sourceId: s.values.sourceId,
          method: s.values.method,
        },
        errors: {},
        isDuplicateDismissed: false,
      })),

    prefill: (vals) =>
      set({
        values: { ...buildDefaultValues(), ...vals },
        errors: {},
        submitState: 'idle',
        successData: null,
        isDuplicateDismissed: false,
      }),

    setErrors: (errors) => set({ errors }),

    clearError: (key) => set((s) => ({ errors: { ...s.errors, [key]: undefined } })),

    setSubmitState: (state) => set({ submitState: state }),

    setSuccessData: (data) => set({ successData: data }),

    dismissDuplicate: () => set({ isDuplicateDismissed: true }),

    reset: () =>
      set({
        values: buildDefaultValues(),
        errors: {},
        submitState: 'idle',
        successData: null,
        isDuplicateDismissed: false,
      }),
  }),
);
