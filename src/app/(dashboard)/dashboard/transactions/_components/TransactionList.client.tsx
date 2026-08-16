'use client';

import { TransactionDialog } from '@/components/common/TransactionDialog';
import type { FormOptions } from '@/components/common/TransactionDialog';
import { TransactionTimeline } from '@/components/common/TransactionTimeline';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { useDeleteTransaction, useTransactionDetail } from '@/hooks/useTransactions';
import { mapTxToFormValues } from '@/lib/utils/mapTxToFormValues';
import { groupTransactionsByDate } from '@/lib/utils/transactionTimeline';
import { useTransactionsList } from '@/modules/transactions/hooks/useTransactionsList';
import { useTransactionsSummary } from '@/modules/transactions/hooks/useTransactionsSummary';
import { ReceiptText, RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

interface TransactionListProps {
  initialOptions?: FormOptions;
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
          {refreshing
            ? 'Refreshing…'
            : pullDistance >= 64
              ? 'Release to refresh'
              : 'Pull to refresh'}
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
