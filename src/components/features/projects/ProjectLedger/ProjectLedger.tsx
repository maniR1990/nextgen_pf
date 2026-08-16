'use client';

import { TransactionTable } from '@/components/common/TransactionTable';
import { LogProjectExpenseModal } from '@/components/features/projects/LogProjectExpenseModal';
import { useProjectDetail, useProjectLedger } from '@/hooks/useProjects';
import { useDeleteTransaction, useTransactionDetail } from '@/hooks/useTransactions';
import { queryKeys } from '@/lib/query/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

export interface ProjectLedgerProps {
  projectId: string;
  onAdd?: () => void;
}

export function ProjectLedger({ projectId, onAdd }: ProjectLedgerProps) {
  const { data: rows, isLoading } = useProjectLedger(projectId);
  const { data: project } = useProjectDetail(projectId);
  const qc = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);

  const { data: editTxRaw, isLoading: isLoadingEdit } = useTransactionDetail(editId ?? '');

  const deleteTx = useDeleteTransaction();

  const invalidateProjectQueries = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.projects.detail(projectId) });
    qc.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    qc.invalidateQueries({ queryKey: queryKeys.projects.ledger(projectId) });
  }, [qc, projectId]);

  const handleEditClick = useCallback((id: string) => {
    setEditId(id);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditId(null);
  }, []);

  const handleDeleteClick = useCallback(
    (id: string) => {
      if (!window.confirm('Delete this transaction? This cannot be undone.')) return;
      deleteTx.mutate(id, { onSuccess: invalidateProjectQueries });
    },
    [deleteTx, invalidateProjectQueries],
  );

  return (
    <>
      <TransactionTable
        title="Project ledger"
        rows={rows ?? []}
        loading={isLoading}
        onAdd={onAdd}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {editId && project && !isLoadingEdit && (
        <LogProjectExpenseModal
          open
          onClose={handleEditClose}
          project={project}
          editId={editId}
          editTransaction={editTxRaw}
        />
      )}
    </>
  );
}
