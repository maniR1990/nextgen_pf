'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';
import type { FundAllocationInput } from '@/modules/funds/funds.types';

export interface AllocationEditorProps {
  open: boolean;
  onClose: () => void;
  fundName: string;
  accountGroups: AccountGroupWithAccounts[];
  initialAllocations: FundAllocationInput[];
  onSave: (allocations: FundAllocationInput[]) => Promise<void>;
  otherFundsSources?: Array<{ accountId: string; type: 'PERCENTAGE' | 'FIXED'; value: number }>;
}

interface RowState {
  accountId: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: string;
  priority: number;
}

const TITLE_ID = 'allocation-editor-title';

export function AllocationEditor({
  open,
  onClose,
  fundName,
  accountGroups,
  initialAllocations,
  onSave,
  otherFundsSources = [],
}: AllocationEditorProps) {
  const allAccounts = accountGroups.flatMap((g) =>
    g.accounts.filter((a) => a.status === 'ACTIVE' && !a.isHidden),
  );

  const [rows, setRows] = useState<RowState[]>(() =>
    initialAllocations.map((a, i) => ({
      accountId: a.accountId,
      type: a.type as 'PERCENTAGE' | 'FIXED',
      value: String(a.value),
      priority: a.priority ?? i,
    })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedIds = new Set(rows.map((r) => r.accountId));

  function addRow(accountId: string) {
    setRows((prev) => [
      ...prev,
      { accountId, type: 'PERCENTAGE', value: '', priority: prev.length },
    ]);
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  async function handleSave() {
    const allocations: FundAllocationInput[] = rows.map((r) => ({
      accountId: r.accountId,
      type: r.type,
      value: parseFloat(r.value) || 0,
      priority: r.priority,
    }));
    setError('');
    setLoading(true);
    try {
      await onSave(allocations);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save allocations');
    } finally {
      setLoading(false);
    }
  }

  const overAllocWarnings = rows
    .filter((r) => r.type === 'PERCENTAGE')
    .flatMap((r) => {
      const otherPct = otherFundsSources
        .filter((s) => s.accountId === r.accountId && s.type === 'PERCENTAGE')
        .reduce((sum, s) => sum + s.value, 0);
      const totalPct = (parseFloat(r.value) || 0) + otherPct;
      if (totalPct > 100) {
        const acc = allAccounts.find((a) => a.id === r.accountId);
        return [{ accountName: acc?.name ?? r.accountId, totalPct: Math.round(totalPct) }];
      }
      return [];
    });

  return (
    <Modal open={open} onClose={onClose} titleId={TITLE_ID} size="lg">
      <Modal.Header>
        <h2 id={TITLE_ID} className="modal__title">Fund Allocation — {fundName}</h2>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <div className="allocation-editor">
          <div className="allocation-editor__pick">
            <p className="allocation-editor__hint">Select accounts to feed this fund:</p>
            <ul className="allocation-editor__account-list">
              {allAccounts.map((acc) => (
                <li key={acc.id} className="allocation-editor__account-item">
                  <span className="allocation-editor__account-name">{acc.name}</span>
                  {!selectedIds.has(acc.id) ? (
                    <Button size="sm" variant="ghost" onClick={() => addRow(acc.id)}>
                      + Add
                    </Button>
                  ) : (
                    <span className="allocation-editor__account-added">Added</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {rows.length > 0 && (
            <div className="allocation-editor__rows">
              <p className="allocation-editor__hint">How much should each account contribute?</p>
              {rows.map((row, idx) => {
                const acc = allAccounts.find((a) => a.id === row.accountId);
                return (
                  <div key={row.accountId} className="allocation-editor__row">
                    <span className="allocation-editor__row-name">{acc?.name ?? row.accountId}</span>
                    <div className="allocation-editor__row-controls">
                      <input
                        type="number"
                        className="allocation-editor__value-input"
                        min="0"
                        step={row.type === 'PERCENTAGE' ? '1' : '100'}
                        value={row.value}
                        aria-label={`${acc?.name ?? 'Account'} allocation amount`}
                        placeholder={row.type === 'PERCENTAGE' ? '10' : '5000'}
                        onChange={(e) => updateRow(idx, { value: e.target.value })}
                      />
                      <select
                        className="allocation-editor__type-select"
                        value={row.type}
                        aria-label="Allocation type"
                        onChange={(e) => updateRow(idx, { type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                      >
                        <option value="PERCENTAGE">% of balance</option>
                        <option value="FIXED">₹ fixed amount</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      className="allocation-editor__remove"
                      aria-label={`Remove ${acc?.name}`}
                      onClick={() => removeRow(idx)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {overAllocWarnings.length > 0 && (
            <div className="allocation-editor__over-alloc-warning" role="alert">
              <strong>Over-allocation warning</strong>
              {overAllocWarnings.map((w) => (
                <span key={w.accountName}>
                  {w.accountName} is allocated {w.totalPct}% across all funds — only 100% of a balance can be claimed.
                </span>
              ))}
            </div>
          )}
          {error && <p className="form-field__error" role="alert">{error}</p>}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button loading={loading} onClick={handleSave}>Save Allocations</Button>
      </Modal.Footer>
    </Modal>
  );
}
