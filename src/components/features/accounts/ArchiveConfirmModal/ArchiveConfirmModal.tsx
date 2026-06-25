'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useState } from 'react';

export interface ArchiveConfirmModalProps {
  open: boolean;
  onClose: () => void;
  accountName: string;
  activeFundLinks?: number;
  pendingEmis?: number;
  onConfirm: () => Promise<void>;
}

const TITLE_ID = 'archive-modal-title';

export function ArchiveConfirmModal({
  open,
  onClose,
  accountName,
  activeFundLinks = 0,
  pendingEmis = 0,
  onConfirm,
}: ArchiveConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId={TITLE_ID}>
      <Modal.Header title={`Archive "${accountName}"?`}>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <p className="archive-confirm-modal__body">
          Archived accounts are hidden from active views and cannot receive new transactions. You
          can restore them later from account settings.
        </p>
        {activeFundLinks > 0 && (
          <div
            className="archive-confirm-modal__impact archive-confirm-modal__impact--warn"
            role="status"
          >
            <strong>{activeFundLinks}</strong> active fund link{activeFundLinks !== 1 ? 's' : ''}{' '}
            will be unlinked.
          </div>
        )}
        {pendingEmis > 0 && (
          <div
            className="archive-confirm-modal__impact archive-confirm-modal__impact--warn"
            role="status"
          >
            <strong>{pendingEmis}</strong> pending EMI{pendingEmis !== 1 ? 's' : ''} will be
            cancelled.
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" loading={loading} onClick={handleConfirm}>
          Archive
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
