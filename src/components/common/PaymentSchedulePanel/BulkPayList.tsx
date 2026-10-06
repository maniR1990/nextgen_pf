'use client';

import { useToast } from '@/components/common/ToastProvider/useToast';
import { useUpdateBudgetPlan } from '@/hooks/useBudgetSummary';
import { useCreateTransaction } from '@/hooks/useTransactions';
import type { PaymentSourceOption } from '@/types/finance';
import { useMemo, useState } from 'react';
import {
  buildBillTransaction,
  defaultPayAmount,
  readLastSources,
  rememberSource,
  todayISO,
  txTypeForGroup,
} from './bulkPay';
import { type DuePaymentItem, getStatus, ordinal } from './derivePayments';

export interface BulkPayListProps {
  items: DuePaymentItem[];
  sources: PaymentSourceOption[];
  /** Budget period the bills belong to. */
  year: number;
  month: number;
  todayDay: number;
  isFutureMonth: boolean;
  /** Called once every selected bill was logged and settled. */
  onDone: () => void;
}

interface RowDraft {
  sourceId: string;
  amount: number;
}

function fmt(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function BulkPayList({
  items,
  sources,
  year,
  month,
  todayDay,
  isFutureMonth,
  onDone,
}: BulkPayListProps) {
  const { mutateAsync: createTx } = useCreateTransaction();
  const updatePlan = useUpdateBudgetPlan(year, month);
  const toast = useToast();

  // Bills logged in this run — hidden immediately so a partial failure can't lead to
  // logging them twice while the budget refetch is still in flight.
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const payable = useMemo(
    () =>
      items.filter((i) => !i.paid && txTypeForGroup(i.groupType) !== null && !doneIds.has(i.id)),
    [items, doneIds],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [lastSources] = useState(readLastSources);
  const [running, setRunning] = useState(false);

  function draftOf(item: DuePaymentItem): RowDraft {
    const remembered = lastSources[item.id];
    const sourceId = sources.some((s) => s.id === remembered) ? remembered : (sources[0]?.id ?? '');
    return drafts[item.id] ?? { sourceId, amount: defaultPayAmount(item) };
  }

  function patchDraft(item: DuePaymentItem, patch: Partial<RowDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [item.id]: { ...draftOf(item), ...patch },
    }));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const chosen = payable.filter((i) => selected.has(i.id));
  const total = chosen.reduce((sum, i) => sum + draftOf(i).amount, 0);
  const allSelected = payable.length > 0 && chosen.length === payable.length;

  async function handleLog() {
    if (chosen.length === 0 || running) return;
    const invalid = chosen.find((i) => draftOf(i).amount <= 0 || !draftOf(i).sourceId);
    if (invalid) {
      toast.error(`Enter an amount and account for ${invalid.name}`);
      return;
    }

    setRunning(true);
    const date = todayISO();
    const succeeded: DuePaymentItem[] = [];
    const failed: DuePaymentItem[] = [];

    // Sequential, not parallel — each write moves an account balance, and one at a
    // time keeps a failure isolated to its own bill.
    for (const item of chosen) {
      const draft = draftOf(item);
      const source = sources.find((s) => s.id === draft.sourceId)!;
      try {
        const tx = await createTx(
          buildBillTransaction({
            item,
            source,
            amount: draft.amount,
            year,
            month,
            date,
          }),
        );
        await updatePlan.mutateAsync({
          categoryId: item.id,
          data: { settled: true, settledTransactionId: tx.id },
        });
        rememberSource(item.id, source.id);
        succeeded.push(item);
      } catch {
        failed.push(item);
      }
    }

    setDoneIds((prev) => new Set([...prev, ...succeeded.map((i) => i.id)]));
    setSelected(new Set(failed.map((i) => i.id)));
    setRunning(false);

    if (succeeded.length > 0) {
      const sum = succeeded.reduce((s, i) => s + draftOf(i).amount, 0);
      toast.success(`${succeeded.length} bill${succeeded.length === 1 ? '' : 's'} logged`, {
        description: `${fmt(sum)} · marked paid in Budget`,
      });
    }
    if (failed.length > 0) {
      toast.error(
        `Couldn't log ${failed.map((i) => i.name).join(', ')}. They're still selected — try again.`,
      );
      return;
    }
    onDone();
  }

  if (payable.length === 0) {
    return <p className="psp__bulk-empty">Nothing left to pay this month.</p>;
  }

  return (
    <div className="psp__bulk">
      <div className="psp__bulk-tools">
        <button
          type="button"
          className="psp__bulk-chip"
          onClick={() => setSelected(allSelected ? new Set() : new Set(payable.map((i) => i.id)))}
        >
          {allSelected ? 'Clear selection' : 'Select all'}
        </button>
        <span className="psp__bulk-hint">Logged with today&apos;s date</span>
      </div>

      <ul className="psp__bulk-list">
        {payable.map((item) => {
          const draft = draftOf(item);
          const status = getStatus(item, todayDay, isFutureMonth);
          const checked = selected.has(item.id);
          return (
            <li
              key={item.id}
              className={`psp__bulk-row${checked ? ' psp__bulk-row--on' : ''}`}
              data-status={status}
            >
              <input
                type="checkbox"
                className="psp__bulk-check"
                checked={checked}
                onChange={() => toggle(item.id)}
                aria-label={`Select ${item.name}`}
                disabled={running}
              />
              <span className="psp__row-day">
                {item.dueDay}
                <sup>{ordinal(item.dueDay)}</sup>
              </span>
              <span className="psp__bulk-name">
                <span className="psp__row-name" title={item.name}>
                  {item.name}
                </span>
                {status === 'overdue' && (
                  <span className="psp__row-badge psp__row-badge--overdue">Overdue</span>
                )}
                {item.groupType === 'INVESTMENT' && (
                  <span className="psp__bulk-tag">Investment</span>
                )}
              </span>
              <select
                className="psp__qp-select psp__bulk-source"
                value={draft.sourceId}
                onChange={(e) => patchDraft(item, { sourceId: e.target.value })}
                aria-label={`Account for ${item.name}`}
                disabled={running}
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="psp__qp-amt-wrap psp__bulk-amt">
                <span className="psp__qp-sym">₹</span>
                <input
                  type="number"
                  className="psp__qp-amt"
                  min={1}
                  value={draft.amount}
                  onChange={(e) => patchDraft(item, { amount: Number(e.target.value) })}
                  aria-label={`Amount for ${item.name}`}
                  disabled={running}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <div className="psp__bulk-foot">
        <span className="psp__bulk-summary">
          {chosen.length} of {payable.length} selected
        </span>
        <button
          type="button"
          className="psp__qp-pay psp__bulk-log"
          onClick={handleLog}
          aria-busy={running}
        >
          {running
            ? 'Logging…'
            : chosen.length === 0
              ? 'Select bills to log'
              : `Log ${chosen.length} selected · ${fmt(total)}`}
        </button>
      </div>
    </div>
  );
}
