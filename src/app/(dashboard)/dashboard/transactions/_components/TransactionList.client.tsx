'use client';

import { useMemo, useState, useCallback } from 'react';
import { ReceiptText, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { TransactionTimeline } from '@/components/common/TransactionTimeline';
import { TransactionDialog } from '@/components/common/TransactionDialog';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { groupTransactionsByDate } from '@/lib/utils/transactionTimeline';
import { useTransactionsList } from '@/modules/transactions/hooks/useTransactionsList';
import { useToast } from '@/components/common/ToastProvider/useToast';
import type { FormOptions } from '@/components/common/TransactionDialog';
import type { TransactionFormValues } from '@/store/transactionFormStore';

interface TransactionListProps {
  initialOptions?: FormOptions;
}

interface EditState {
  id: string;
  prefillValues: Partial<TransactionFormValues>;
}

// Map the API GET /transactions/:id response to form values
function mapTxToFormValues(tx: Record<string, unknown>): Partial<TransactionFormValues> {
  const dateStr = typeof tx.date === 'string' ? tx.date.split('T')[0] : '';
  const account = tx.account as { id?: string } | null | undefined;
  const category = tx.category as { id?: string } | null | undefined;
  const toAccount = tx.toAccount as { id?: string } | null | undefined;

  return {
    type: (tx.type as TransactionFormValues['type']) ?? 'EXPENSE',
    date: dateStr,
    amount: tx.amount != null ? String(tx.amount) : '',
    merchant: (tx.merchant as string) ?? '',
    categoryId: category?.id ?? '',
    sourceId: account?.id ?? '',
    toAccountId: toAccount?.id ?? '',
    method: (tx.paymentMethod as string) ?? 'UPI',
    isPlanned: (tx.isPlanned as boolean) ?? true,
    isRecurring: (tx.isRecurring as boolean) ?? false,
    notes: (tx.notes as string) ?? '',
    tags: Array.isArray(tx.tags) ? (tx.tags as string[]).join(', ') : '',
    budgetPeriodYear: (tx.budgetPeriodYear as number) ?? new Date().getFullYear(),
    budgetPeriodMonth: (tx.budgetPeriodMonth as number) ?? new Date().getMonth() + 1,
    // Investment
    assetClass: (tx.assetClass as string) ?? '',
    fundName: (tx.fundName as string) ?? '',
    units: tx.units != null ? String(tx.units) : '',
    nav: tx.nav != null ? String(tx.nav) : '',
    mfPlan: (tx.mfPlan as string) ?? '',
    taxSection: (tx.taxSection as string) ?? '',
    // Income
    incomeType: (tx.incomeType as string) ?? '',
    tds: tx.tds != null ? String(tx.tds) : '',
    // Gift
    giftFrom: (tx.giftFrom as string) ?? '',
    occasion: (tx.occasion as string) ?? '',
    // Sinking
    sfId: (tx.sfId as string) ?? '',
    // Expense extras
    isTaxDed: (tx.isTaxDed as boolean) ?? false,
    isReimbursable: (tx.isReimbursable as boolean) ?? false,
    reimbDate: (tx.reimbDate as string) ?? '',
    // Reimbursement
    reimbFrom: (tx.reimbFrom as string) ?? '',
    origTxRef: (tx.origTxRef as string) ?? '',
    // Transfer
    txPurpose: (tx.txPurpose as string) ?? '',
    txFee: tx.txFee != null ? String(tx.txFee) : '',
    // ATM
    atmLocation: (tx.atmLocation as string) ?? '',
    atmPurpose: (tx.atmPurpose as string) ?? '',
    // Refund
    refundReason: (tx.refundReason as string) ?? '',
    // Coupon
    origPrice: tx.origPrice != null ? String(tx.origPrice) : '',
    couponCode: (tx.couponCode as string) ?? '',
    platform: (tx.platform as string) ?? '',
    // Points
    ptsSpent: tx.ptsSpent != null ? String(tx.ptsSpent) : '',
    ptsRate: tx.ptsRate != null ? String(tx.ptsRate) : '',
  };
}

export function TransactionList({ initialOptions }: TransactionListProps = {}) {
  const { filters } = useTransactionFilters();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [editState, setEditState] = useState<EditState | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactionsList(filters);

  const rows = useMemo(
    () => data?.pages.flatMap((p) => p.rows) ?? [],
    [data],
  );

  const groups = useMemo(() => groupTransactionsByDate(rows), [rows]);

  const handleEditClick = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/v1/transactions/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load transaction');
      const json = await res.json();
      const tx = json.data as Record<string, unknown>;
      setEditState({ id, prefillValues: mapTxToFormValues(tx) });
    } catch {
      toast.error('Could not load transaction for editing');
    }
  }, [toast]);

  const handleDeleteClick = useCallback(async (id: string) => {
    if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/v1/transactions/${id}`, {
        method: 'DELETE',
        headers: { 'X-Confirm-Delete': 'true' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast.success('Transaction deleted');
    } catch {
      toast.error('Failed to delete transaction');
    }
  }, [queryClient, toast]);

  const handleEditClose = useCallback(() => {
    setEditState(null);
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['budget'] });
  }, [queryClient]);

  return (
    <div className="tx-page__content">
      {isLoading && <TransactionTimeline groups={[]} loading />}

      {isError && (
        <div className="tx-list__empty">
          <RefreshCw size={32} />
          <p className="tx-list__empty-title">Failed to load transactions</p>
          <button type="button" className="btn btn--secondary" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <div className="tx-list__empty">
          <ReceiptText size={40} />
          <p className="tx-list__empty-title">No transactions for this period</p>
          <p className="tx-list__empty-text">
            Adjust filters or use Log in the header to add an entry
          </p>
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <TransactionTimeline
          groups={groups}
          hasMore={hasNextPage}
          loading={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          showSummary
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      )}

      {editState && (
        <TransactionDialog
          open
          onClose={handleEditClose}
          initialOptions={initialOptions}
          editId={editState.id}
          prefillValues={editState.prefillValues}
        />
      )}
    </div>
  );
}
