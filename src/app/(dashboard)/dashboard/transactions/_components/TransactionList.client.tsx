'use client';

import { TransactionDialog } from '@/components/common/TransactionDialog';
import type { FormOptions } from '@/components/common/TransactionDialog';
import { TransactionTimeline } from '@/components/common/TransactionTimeline';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { useDeleteTransaction, useTransactionDetail } from '@/hooks/useTransactions';
import { groupTransactionsByDate } from '@/lib/utils/transactionTimeline';
import { useTransactionsList } from '@/modules/transactions/hooks/useTransactionsList';
import { useTransactionsSummary } from '@/modules/transactions/hooks/useTransactionsSummary';
import type { TransactionFormValues } from '@/store/transactionFormStore';
import { ReceiptText, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface TransactionListProps {
  initialOptions?: FormOptions;
}

// Map the API GET /transactions/:id response → form prefill values
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
    assetClass: (tx.assetClass as string) ?? '',
    fundName: (tx.fundName as string) ?? '',
    units: tx.units != null ? String(tx.units) : '',
    nav: tx.nav != null ? String(tx.nav) : '',
    mfPlan: (tx.mfPlan as string) ?? '',
    taxSection: (tx.taxSection as string) ?? '',
    incomeType: (tx.incomeType as string) ?? '',
    tds: tx.tds != null ? String(tx.tds) : '',
    giftFrom: (tx.giftFrom as string) ?? '',
    occasion: (tx.occasion as string) ?? '',
    sfId: (tx.sfId as string) ?? '',
    isTaxDed: (tx.isTaxDed as boolean) ?? false,
    isReimbursable: (tx.isReimbursable as boolean) ?? false,
    reimbDate: (tx.reimbDate as string) ?? '',
    reimbFrom: (tx.reimbFrom as string) ?? '',
    origTxRef: (tx.origTxRef as string) ?? '',
    txPurpose: (tx.txPurpose as string) ?? '',
    txFee: tx.txFee != null ? String(tx.txFee) : '',
    atmLocation: (tx.atmLocation as string) ?? '',
    atmPurpose: (tx.atmPurpose as string) ?? '',
    refundReason: (tx.refundReason as string) ?? '',
    origPrice: tx.origPrice != null ? String(tx.origPrice) : '',
    couponCode: (tx.couponCode as string) ?? '',
    platform: (tx.platform as string) ?? '',
    ptsSpent: tx.ptsSpent != null ? String(tx.ptsSpent) : '',
    ptsRate: tx.ptsRate != null ? String(tx.ptsRate) : '',
  };
}

export function TransactionList({ initialOptions }: TransactionListProps = {}) {
  const { filters } = useTransactionFilters();

  const [editId, setEditId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTransactionsList(filters);
  const { data: periodSummary } = useTransactionsSummary(filters.year, filters.month);
  const { pullDistance, refreshing, isPulling } = usePullToRefresh(
    async () => {
      await refetch();
    },
    { disabled: isLoading },
  );

  // Fetch the selected transaction for edit — cached by id, no raw fetch needed
  const { data: editTxRaw, isLoading: isLoadingEdit } = useTransactionDetail(editId ?? '');
  const prefillValues = editTxRaw ? mapTxToFormValues(editTxRaw) : undefined;

  const deleteTx = useDeleteTransaction();

  const rows = useMemo(() => data?.pages.flatMap((p) => p.rows) ?? [], [data]);
  const groups = useMemo(() => groupTransactionsByDate(rows), [rows]);

  const handleEditClick = useCallback((id: string) => {
    setEditId(id);
  }, []);

  const handleDeleteClick = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
      deleteTx.mutate(id);
    },
    [deleteTx],
  );

  // Close edit dialog — invalidation already done by patchTx mutation in the form hook
  const handleEditClose = useCallback(() => {
    setEditId(null);
  }, []);

  return (
    <div className="tx-page__content">
      {/* Mobile-only pull-to-refresh — height tracks the drag, collapses instantly once
          released unless the threshold was met (see usePullToRefresh). */}
      {(isPulling || refreshing) && (
        <div
          className={`tx-pull-indicator${refreshing ? ' tx-pull-indicator--refreshing' : ''}`}
          style={{ height: refreshing ? 40 : pullDistance }}
          role="status"
          aria-live="polite"
        >
          <RefreshCw size={16} className="tx-pull-indicator__icon" aria-hidden />
          {refreshing ? 'Refreshing…' : pullDistance >= 64 ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}

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
          loadingMore={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          showSummary
          summary={periodSummary}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      )}

      {/* Edit dialog — wait for prefill data before opening so form is never blank */}
      {editId && !isLoadingEdit && prefillValues && (
        <TransactionDialog
          open
          onClose={handleEditClose}
          initialOptions={initialOptions}
          editId={editId}
          prefillValues={prefillValues}
        />
      )}
    </div>
  );
}
