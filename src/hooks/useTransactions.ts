'use client';

/**
 * Transaction React Query hooks.
 *
 * Invalidation strategy:
 *  CREATE  → lists + budget + accounts (TRANSFER only) + dashboard
 *  PATCH   → detail(id) + lists + budget + accounts (TRANSFER only) + dashboard
 *  DELETE  → detail(id) + lists + budget + accounts + dashboard
 *  VOID    → detail(id) + lists + budget + dashboard
 *
 * Always invalidate `transactions.lists()` (not `.all`) so we don't
 * accidentally bust individual detail queries that haven't changed.
 *
 * `dashboard.all` must always be included: every dashboard widget (spend
 * summary, calendar, subscriptions) aggregates the same FinanceTransaction
 * rows this module writes, and without this the dashboard would keep
 * showing pre-edit totals until its own staleTime happens to lapse —
 * visibly disagreeing with the just-edited Transactions page.
 */

import { useToast } from '@/components/common/ToastProvider/useToast';
import { apiDeleteV1, apiGetV1, apiPatchV1, apiPostV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TransactionBody {
  type: string;
  date: string;
  budgetPeriodYear: number;
  budgetPeriodMonth: number;
  amount: number;
  merchant?: string;
  categoryId?: string;
  paymentSourceId: string;
  toAccountId?: string;
  paymentMethod: string;
  isPlanned: boolean;
  isRecurring: boolean;
  notes?: string;
  tags?: string[];
  // Investment
  assetClass?: string;
  fundName?: string;
  units?: number;
  nav?: number;
  mfPlan?: string;
  taxSection?: string;
  // Income
  incomeType?: string;
  tds?: number;
  // Gift
  giftFrom?: string;
  occasion?: string;
  // Sinking / fund purpose-tag
  fundId?: string;
  fundFlow?: 'IN' | 'OUT';
  // Expense extras
  isTaxDed?: boolean;
  isReimbursable?: boolean;
  reimbDate?: string;
  // Reimbursement
  reimbFrom?: string;
  origTxRef?: string;
  // Transfer
  txPurpose?: string;
  txFee?: number;
  // ATM
  atmLocation?: string;
  atmPurpose?: string;
  // Refund
  refundReason?: string;
  // Coupon
  origPrice?: number;
  couponCode?: string;
  platform?: string;
  // Points
  ptsSpent?: number;
  ptsRate?: number;
  // Recurring
  recSchedule?: {
    frequency: string;
    every: number;
    endCondition: string;
    count?: number;
    endDate?: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function invalidateAfterWrite(
  qc: ReturnType<typeof useQueryClient>,
  opts: { id?: string; isTransfer?: boolean },
) {
  void qc.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
  void qc.invalidateQueries({ queryKey: queryKeys.transactions.summaries() });
  void qc.invalidateQueries({ queryKey: queryKeys.budget.all });
  void qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
  if (opts.id) {
    void qc.invalidateQueries({ queryKey: queryKeys.transactions.detail(opts.id) });
  }
  if (opts.isTransfer) {
    void qc.invalidateQueries({ queryKey: queryKeys.accounts.all });
  }
}

// ── Detail query ──────────────────────────────────────────────────────────────

/** Fetch a single transaction by id. Disabled when id is empty. */
export function useTransactionDetail(id: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: queryKeys.transactions.detail(id),
    queryFn: () => apiGetV1<Record<string, unknown>>(`/api/v1/transactions/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// ── Create ────────────────────────────────────────────────────────────────────

export function useCreateTransaction() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body: TransactionBody) => {
      // Idempotency key is generated per submission call.
      // useMutation does not retry by default, so this is safe.
      const idempotencyKey = crypto.randomUUID();
      return apiPostV1<{ id: string }>('/api/v1/transactions', body, {
        'X-Idempotency-Key': idempotencyKey,
      });
    },
    onSuccess: (_data, variables) => {
      invalidateAfterWrite(qc, { isTransfer: variables.type === 'TRANSFER' });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to log transaction');
    },
  });
}

// ── Patch ─────────────────────────────────────────────────────────────────────

export function usePatchTransaction(id: string) {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (body: Partial<TransactionBody>) =>
      apiPatchV1<Record<string, unknown>>(`/api/v1/transactions/${id}`, body),
    onSuccess: (_data, variables) => {
      invalidateAfterWrite(qc, { id, isTransfer: variables.type === 'TRANSFER' });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update transaction');
    },
  });
}

// ── Delete ────────────────────────────────────────────────────────────────────

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) =>
      apiDeleteV1<void>(`/api/v1/transactions/${id}`, { 'X-Confirm-Delete': 'true' }),
    onSuccess: (_data, id) => {
      // Accounts always need refresh since any tx type can affect balances
      invalidateAfterWrite(qc, { id, isTransfer: true });
      toast.success('Transaction deleted');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete transaction');
    },
  });
}

// ── Void ──────────────────────────────────────────────────────────────────────

export function useVoidTransaction() {
  const qc = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => apiPostV1<void>(`/api/v1/transactions/${id}/void`, {}),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.transactions.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.transactions.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.transactions.summaries() });
      void qc.invalidateQueries({ queryKey: queryKeys.budget.all });
      void qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      toast.success('Transaction voided');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to void transaction');
    },
  });
}
