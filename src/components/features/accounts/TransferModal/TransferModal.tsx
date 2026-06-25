'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/common/FormField';
import { AmountInput } from '@/components/common/AmountInput';
import { SelectField } from '@/components/common/SelectField';
import type { AccountSummary } from '@/modules/accounts/accounts.types';

export interface TransferPayload {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
  date: string;
}

export interface TransferModalProps {
  open: boolean;
  onClose: () => void;
  accounts: AccountSummary[];
  fromAccountId: string;
  onSubmit: (payload: TransferPayload) => Promise<void>;
}

const TITLE_ID = 'transfer-modal-title';

export function TransferModal({
  open,
  onClose,
  accounts,
  fromAccountId,
  onSubmit,
}: TransferModalProps) {
  const [toAccountId, setToAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toOptions = accounts
    .filter((a) => a.id !== fromAccountId && a.status === 'ACTIVE')
    .map((a) => ({ value: a.id, label: a.name }));

  const fromAccount = accounts.find((a) => a.id === fromAccountId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!toAccountId) { setError('Select a destination account'); return; }
    if (!parsedAmount || parsedAmount <= 0) { setError('Enter a valid amount'); return; }
    setError('');
    setLoading(true);
    try {
      await onSubmit({
        fromAccountId,
        toAccountId,
        amount: parsedAmount,
        note,
        date: new Date(date).toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId={TITLE_ID}>
      <Modal.Header>
        <h2 id={TITLE_ID} className="modal__title">Transfer</h2>
        <p className="modal__subtitle">From: {fromAccount?.name}</p>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <form id="transfer-form" onSubmit={handleSubmit} noValidate>
          <SelectField
            label="To Account"
            options={toOptions}
            placeholder="Select destination"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            required
          />
          <AmountInput
            value={amount}
            onChange={setAmount}
            label="Amount (₹)"
            showChips={false}
          />
          <FormField label="Date" htmlFor="transfer-date">
            <input
              id="transfer-date"
              type="date"
              className="select-field__control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </FormField>
          <FormField label="Note (optional)" htmlFor="transfer-note">
            <input
              id="transfer-note"
              type="text"
              className="select-field__control"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="e.g. Monthly savings transfer"
            />
          </FormField>
          {error && <p className="form-field__error" role="alert">{error}</p>}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button type="submit" form="transfer-form" loading={loading}>Transfer</Button>
      </Modal.Footer>
    </Modal>
  );
}
