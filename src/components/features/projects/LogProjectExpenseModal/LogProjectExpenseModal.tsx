'use client';

import { FormField } from '@/components/common/FormField';
import { useFormOptions } from '@/components/common/TransactionDialog/hooks/useFormOptions';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { ProjectPaymentType, ProjectSummary } from '@/hooks/useProjects';
import { useCreateTransaction, usePatchTransaction } from '@/hooks/useTransactions';
import { queryKeys } from '@/lib/query/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { Link2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface LogProjectExpenseModalProps {
  open: boolean;
  onClose: () => void;
  project: ProjectSummary;
  /** When set, opens in edit mode against this transaction instead of creating a
   *  new one — pass the raw GET /api/v1/transactions/:id response for prefill. */
  editId?: string;
  editTransaction?: Record<string, unknown>;
}

const UNPLANNED = '';
const NO_VENDOR = '';

const PAYMENT_TYPES: ProjectPaymentType[] = ['ADVANCE', 'MILESTONE', 'FINAL', 'REFUND'];
const PAYMENT_TYPE_LABEL: Record<ProjectPaymentType, string> = {
  ADVANCE: 'Advance',
  MILESTONE: 'Milestone',
  FINAL: 'Final',
  REFUND: 'Refund',
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Dedicated modal, not the day-to-day AddTransactionModal — see plan doc Slice 3.
 * Same underlying ledger though: submits through the exact same
 * POST /api/v1/transactions path and useCreateTransaction hook every other
 * transaction entry point uses, just pre-scoped to this project's context.
 *
 * "Paid to" and the vendor contract link used to be two separate "Vendor" fields
 * with no relationship — see the UX review this modal implements. One combobox
 * now drives both: typing free text clears any link, picking a suggestion (or
 * picking a Forecast line that already has a vendor attached) sets both the
 * payee name and the contract link together.
 */
export function LogProjectExpenseModal({
  open,
  onClose,
  project,
  editId,
  editTransaction,
}: LogProjectExpenseModalProps) {
  const { sources } = useFormOptions();
  const createTransaction = useCreateTransaction();
  const patchTransaction = usePatchTransaction(editId ?? '');
  const qc = useQueryClient();
  const isEdit = !!editId;

  const [merchant, setMerchant] = useState('');
  const [vendorId, setVendorId] = useState(NO_VENDOR);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [forecastLineId, setForecastLineId] = useState(UNPLANNED);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayInputValue());
  const [accountId, setAccountId] = useState('');
  const [paymentType, setPaymentType] = useState<ProjectPaymentType>('MILESTONE');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedLine = project.forecastLines.find((l) => l.id === forecastLineId) ?? null;
  const linkedVendor = project.vendors.find((v) => v.id === vendorId) ?? null;

  const suggestions = useMemo(() => {
    const q = merchant.trim().toLowerCase();
    if (!q) return project.vendors;
    return project.vendors.filter((v) => v.name.toLowerCase().includes(q));
  }, [project.vendors, merchant]);

  useEffect(() => {
    if (!open) return;
    setError('');
    setSuggestOpen(false);

    if (editTransaction) {
      const account = editTransaction.account as { id?: string } | null | undefined;
      const rawDate = editTransaction.date;
      setMerchant((editTransaction.merchant as string) ?? '');
      setForecastLineId((editTransaction.projectForecastLineId as string) ?? UNPLANNED);
      setAmount(editTransaction.amount != null ? String(editTransaction.amount) : '');
      setDate(typeof rawDate === 'string' ? rawDate.slice(0, 10) : todayInputValue());
      setAccountId(account?.id ?? project.fundingAccountId ?? '');
      setVendorId((editTransaction.projectVendorId as string) ?? NO_VENDOR);
      setPaymentType((editTransaction.projectPaymentType as ProjectPaymentType) ?? 'MILESTONE');
      return;
    }

    setMerchant('');
    setForecastLineId(UNPLANNED);
    setAmount('');
    setDate(todayInputValue());
    setAccountId(project.fundingAccountId ?? '');
    setVendorId(NO_VENDOR);
    setPaymentType('MILESTONE');
  }, [open, editTransaction, project.fundingAccountId]);

  function handlePaidToChange(value: string) {
    setMerchant(value);
    // Free typing means "not linked to a contract" — a stale link from an earlier
    // pick would otherwise silently keep tagging this payment to the wrong vendor.
    if (vendorId) setVendorId(NO_VENDOR);
  }

  function pickVendor(id: string, name: string) {
    setMerchant(name);
    setVendorId(id);
    setSuggestOpen(false);
  }

  function handleForecastLineChange(lineId: string) {
    setForecastLineId(lineId);
    const line = project.forecastLines.find((l) => l.id === lineId);
    if (!line?.vendorId) return;
    const vendor = project.vendors.find((v) => v.id === line.vendorId);
    if (vendor) pickVendor(vendor.id, vendor.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!merchant.trim()) return setError('Paid to is required');
    if (!amt || amt <= 0) return setError('Enter a valid amount');
    if (!accountId) return setError('Account is required');

    const txDate = new Date(date);
    setError('');
    setSubmitting(true);
    try {
      if (isEdit) {
        await patchTransaction.mutateAsync({
          date: txDate.toISOString(),
          budgetPeriodYear: txDate.getFullYear(),
          budgetPeriodMonth: txDate.getMonth() + 1,
          amount: amt,
          merchant: merchant.trim(),
          paymentSourceId: accountId,
          isPlanned: !!selectedLine,
          projectForecastLineId: selectedLine ? selectedLine.id : '',
          projectVendorId: vendorId || '',
          ...(vendorId && { projectPaymentType: paymentType }),
        });
      } else {
        await createTransaction.mutateAsync({
          type: 'EXPENSE',
          date: txDate.toISOString(),
          budgetPeriodYear: txDate.getFullYear(),
          budgetPeriodMonth: txDate.getMonth() + 1,
          amount: amt,
          merchant: merchant.trim(),
          paymentSourceId: accountId,
          paymentMethod: 'UPI',
          isPlanned: !!selectedLine,
          isRecurring: false,
          projectId: project.id,
          ...(selectedLine && { projectForecastLineId: selectedLine.id }),
          ...(vendorId && { projectVendorId: vendorId, projectPaymentType: paymentType }),
        });
      }
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.projects.ledger(project.id) });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log expense');
    } finally {
      setSubmitting(false);
    }
  }

  const titleId = 'log-project-expense-title';
  const spent = selectedLine?.actualAmount ?? 0;
  const forecast = selectedLine?.forecastAmount ?? 0;
  // Editing an entry that's already matched to the selected line: `spent` already
  // includes this entry's *original* amount, so adding the field's new amount on
  // top would double-count it. Only true when the line hasn't been switched —
  // moving to a different line means that line's actualAmount never included this
  // entry to begin with, so the plain create-mode math applies there.
  const originalAmount =
    isEdit && editTransaction && editTransaction.projectForecastLineId === forecastLineId
      ? Number(editTransaction.amount ?? 0)
      : 0;
  const previewSpent = spent - originalAmount + (Number(amount) || 0);

  return (
    <Modal open={open} onClose={onClose} size="lg" titleId={titleId}>
      <Modal.Header>
        <div className="modal__title-group">
          <h2 id={titleId} className="modal__title">
            {isEdit ? 'Edit project expense' : 'Log project expense'}
          </h2>
          <p className="modal__subtitle">{project.name}</p>
        </div>
        <Modal.CloseButton />
      </Modal.Header>

      <Modal.Body className="add-tx-modal">
        <div className="log-project-expense__progress">
          <span>Forecast ₹{project.forecastTotal.toLocaleString('en-IN')}</span>
          <span>Spent ₹{project.spentTotal.toLocaleString('en-IN')}</span>
          <span>
            Remaining ₹
            {Math.max(0, project.forecastTotal - project.spentTotal).toLocaleString('en-IN')}
          </span>
        </div>

        <form id="log-project-expense-form" onSubmit={handleSubmit} noValidate>
          <FormField label="Paid to" htmlFor="lpe-merchant" required>
            <div className="log-project-expense__combo">
              <input
                id="lpe-merchant"
                type="text"
                className="select-field__control"
                value={merchant}
                onChange={(e) => handlePaidToChange(e.target.value)}
                onFocus={() => {
                  clearTimeout(blurTimer.current);
                  setSuggestOpen(true);
                }}
                onBlur={() => {
                  blurTimer.current = setTimeout(() => setSuggestOpen(false), 150);
                }}
                placeholder="Type a name, or pick a vendor below"
                autoComplete="off"
              />
              {suggestOpen && !vendorId && project.vendors.length > 0 && (
                <div className="log-project-expense__suggest">
                  {suggestions.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      className="log-project-expense__suggest-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => pickVendor(v.id, v.name)}
                    >
                      <span>{v.name}</span>
                      <span className="log-project-expense__suggest-balance">
                        bal. ₹{v.balance.toLocaleString('en-IN')}
                      </span>
                    </button>
                  ))}
                  <div className="log-project-expense__suggest-empty">
                    or keep typing to log a one-off payee — no contract required
                  </div>
                </div>
              )}
            </div>
            {linkedVendor && (
              <div className="log-project-expense__linked">
                <Link2 size={13} aria-hidden />
                <span>
                  Linked to {linkedVendor.name} · Balance ₹
                  {linkedVendor.balance.toLocaleString('en-IN')}
                </span>
                <button type="button" onClick={() => setVendorId(NO_VENDOR)}>
                  unlink
                </button>
              </div>
            )}
          </FormField>

          <div className="log-project-expense__row">
            <FormField label="Amount (₹)" htmlFor="lpe-amount" required>
              <input
                id="lpe-amount"
                type="number"
                min={0}
                step="1"
                className="select-field__control"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormField>

            <FormField label="Date" htmlFor="lpe-date" required>
              <input
                id="lpe-date"
                type="date"
                className="select-field__control"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </FormField>
          </div>

          <div className="log-project-expense__section">
            <span className="log-project-expense__section-title">Budget</span>
            <div className="log-project-expense__row">
              <FormField label="Forecast line" htmlFor="lpe-forecast-line">
                <select
                  id="lpe-forecast-line"
                  className="select-field__control"
                  value={forecastLineId}
                  onChange={(e) => handleForecastLineChange(e.target.value)}
                >
                  <option value={UNPLANNED}>— Unplanned —</option>
                  {project.forecastLines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.description}
                      {line.vendorLabel ? ` · ${line.vendorLabel}` : ''} — ₹
                      {line.actualAmount.toLocaleString('en-IN')} of ₹
                      {line.forecastAmount.toLocaleString('en-IN')} used
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Account" htmlFor="lpe-account" required>
                <select
                  id="lpe-account"
                  className="select-field__control"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                >
                  <option value="">Select account</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            {selectedLine && (
              <p className="log-project-expense__match">
                Matches {selectedLine.description} — ₹{previewSpent.toLocaleString('en-IN')} of ₹
                {forecast.toLocaleString('en-IN')} used after this entry
              </p>
            )}
          </div>

          {vendorId && (
            <div className="log-project-expense__section log-project-expense__section--contract">
              <span className="log-project-expense__section-title">Contract</span>
              <div className="log-project-expense__paytype-row">
                {PAYMENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="log-project-expense__paytype"
                    aria-pressed={paymentType === type}
                    onClick={() => setPaymentType(type)}
                  >
                    {PAYMENT_TYPE_LABEL[type]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {error && (
          <p className="form-field__error" role="alert">
            {error}
          </p>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" form="log-project-expense-form" loading={submitting}>
          {isEdit ? 'Save changes' : 'Log expense'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
