'use client';

import { useToast } from '@/components/common/ToastProvider/useToast';
import { useUpdateBudgetPlan } from '@/hooks/useBudgetSummary';
import { useCreateTransaction, useVoidTransaction } from '@/hooks/useTransactions';
import { apiGetV1 } from '@/lib/query/fetcher';
import { queryKeys } from '@/lib/query/queryKeys';
import type { BudgetGroup } from '@/modules/budget-engine/budget-engine.types';
import type { PaymentSourceOption } from '@/types/finance';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { memo, useEffect, useMemo, useState } from 'react';
import {
  type DuePaymentItem,
  type PaymentStatus,
  derivePayments,
  getStatus,
  ordinal,
  worstStatus,
} from './derivePayments';

// ── Palette ───────────────────────────────────────────────────────────────────

// Semantic tokens, not literal hex — matches the rest of the app's light/dark theming
// instead of freezing these four colors to their light-mode values.
const STATUS_HEX: Record<PaymentStatus, string> = {
  overdue: 'var(--color-error)',
  soon: 'var(--color-warning)',
  upcoming: 'var(--color-info)',
  paid: 'var(--color-success)',
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  overdue: 'Overdue',
  soon: 'Due soon',
  upcoming: 'Upcoming',
  paid: 'Paid',
};

const STORAGE_KEY = 'psp-collapsed';

// ── Timeline ──────────────────────────────────────────────────────────────────

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const LEGEND: { status: PaymentStatus; label: string }[] = [
  { status: 'overdue', label: 'Overdue' },
  { status: 'soon', label: 'Due within 3 days' },
  { status: 'upcoming', label: 'Upcoming' },
  { status: 'paid', label: 'Paid' },
];

interface TimelineProps {
  items: DuePaymentItem[];
  todayDay: number;
  statusOf: (i: DuePaymentItem) => PaymentStatus;
  selectedDay: number | null;
  onDayClick: (day: number) => void;
}

function Timeline({ items, todayDay, statusOf, selectedDay, onDayClick }: TimelineProps) {
  const dotMap = useMemo(() => {
    const m = new Map<number, { status: PaymentStatus; count: number }>();
    for (const item of items) {
      const s = statusOf(item);
      const prev = m.get(item.dueDay);
      m.set(item.dueDay, {
        status: prev ? worstStatus([prev.status, s]) : s,
        count: (prev?.count ?? 0) + 1,
      });
    }
    return m;
  }, [items, statusOf]);

  // Which statuses actually appear (for legend)
  const activeStatuses = useMemo(() => {
    const seen = new Set<PaymentStatus>();
    for (const { status } of dotMap.values()) seen.add(status);
    return LEGEND.filter((l) => seen.has(l.status));
  }, [dotMap]);

  return (
    <div className="psp__tl" aria-label="Payment timeline">
      {/* Day grid */}
      <div className="psp__tl-grid">
        {DAYS.map((d) => {
          const dot = dotMap.get(d);
          const isToday = d === todayDay;
          const isSelected = selectedDay === d;
          // Axis-style labeling, not every-day: with 31 always-visible numbers the font
          // has to shrink to ~6.5px to fit, which is illegible. Labeling only the days
          // that matter (today, selected, has a payment) plus every-5th as an orientation
          // tick — the same pattern chart X-axes use — frees enough room to size the
          // labels that DO show at an actually-readable size.
          const showLabel = dot != null || isToday || isSelected || d === 1 || d % 5 === 0;
          return (
            <div
              key={d}
              className={`psp__tl-cell${isToday ? ' psp__tl-cell--today' : ''}${isSelected ? ' psp__tl-cell--sel' : ''}`}
            >
              <span className="psp__tl-day">{showLabel ? d : ''}</span>
              {dot ? (
                <>
                  {dot.count > 1 && <span className="psp__tl-dot-count">{dot.count}</span>}
                  <button
                    type="button"
                    className={`psp__tl-dot psp__tl-dot--${dot.status}`}
                    style={{ background: STATUS_HEX[dot.status] }}
                    onClick={() => onDayClick(d)}
                    aria-label={`${d} · ${dot.count} payment${dot.count > 1 ? 's' : ''}`}
                    aria-pressed={isSelected}
                  />
                </>
              ) : (
                <span className="psp__tl-dot psp__tl-dot--empty" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {activeStatuses.length > 0 && (
        <div className="psp__tl-legend">
          {activeStatuses.map(({ status, label }) => (
            <span key={status} className="psp__tl-legend-item">
              <span className="psp__tl-legend-dot" style={{ background: STATUS_HEX[status] }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Quick Pay form ────────────────────────────────────────────────────────────

interface QuickPayProps {
  item: DuePaymentItem;
  year: number;
  month: number;
  todayDay: number;
  sources: PaymentSourceOption[];
  onCancel: () => void;
  onSuccess: (txId: string) => void;
  /** Settle without logging any transaction — e.g. paid through a channel this app
   *  doesn't track, or already reconciled elsewhere. */
  onMarkPaidOnly: () => void;
  markingPaid: boolean;
}

function fmt(n: number): string {
  if (Math.abs(n) >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function payMethod(src: PaymentSourceOption) {
  switch (src.type) {
    case 'CREDIT_CARD':
      return 'CREDIT_CARD';
    case 'DEBIT_CARD':
      return 'DEBIT_CARD';
    case 'WALLET':
      return 'WALLET';
    default:
      return 'UPI';
  }
}

function QuickPay({
  item,
  year,
  month,
  todayDay,
  sources,
  onCancel,
  onSuccess,
  onMarkPaidOnly,
  markingPaid,
}: QuickPayProps) {
  const [fromId, setFromId] = useState(sources[0]?.id ?? '');
  const [toId, setToId] = useState('');
  const [txType, setTxType] = useState<'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [amount, setAmount] = useState(item.amount);
  const { mutateAsync, isPending } = useCreateTransaction();
  const toast = useToast();

  // For Transfer, filter out the "from" account in "to" list
  const toSources = sources.filter((s) => s.id !== fromId);

  async function handlePay() {
    if (!fromId || amount <= 0) return;
    if (txType === 'TRANSFER' && !toId) return;
    const src = sources.find((s) => s.id === fromId);
    const date = `${year}-${String(month).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

    const result = await mutateAsync({
      type: txType,
      date,
      budgetPeriodYear: year,
      budgetPeriodMonth: month,
      amount,
      merchant: item.name,
      ...(txType === 'EXPENSE' && { categoryId: item.id }),
      paymentSourceId: fromId,
      ...(txType === 'TRANSFER' && toId && { toAccountId: toId }),
      paymentMethod: src ? payMethod(src) : 'UPI',
      isPlanned: true,
      isRecurring: false,
    });

    toast.success(
      `₹${amount.toLocaleString('en-IN')} ${txType === 'TRANSFER' ? 'transferred' : 'paid'}`,
      {
        description: `${item.name} logged from ${src?.name ?? 'account'}`,
      },
    );
    onSuccess(result.id);
  }

  const src = sources.find((s) => s.id === fromId);
  const canPay = fromId && amount > 0 && (txType === 'EXPENSE' || Boolean(toId));

  return (
    <div className="psp__qp">
      {/* Row 1: From · Type toggle · Amount */}
      <div className="psp__qp-row">
        {/* From account */}
        <div className="psp__qp-field">
          <label className="psp__qp-label">From</label>
          <select
            className="psp__qp-select"
            value={fromId}
            onChange={(e) => {
              setFromId(e.target.value);
              setToId('');
            }}
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.balance != null ? `  ·  ${fmt(s.balance)}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* To account — only for Transfer */}
        {txType === 'TRANSFER' && (
          <>
            <span className="psp__qp-arrow">→</span>
            <div className="psp__qp-field">
              <label className="psp__qp-label">To</label>
              <select
                className="psp__qp-select"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                <option value="">Pick account</option>
                {toSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* Type toggle */}
        <div className="psp__qp-field psp__qp-field--type">
          <label className="psp__qp-label">Type</label>
          <div className="psp__qp-types">
            {(['EXPENSE', 'TRANSFER'] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`psp__qp-type${txType === t ? ' psp__qp-type--on' : ''}`}
                onClick={() => setTxType(t)}
              >
                {t === 'EXPENSE' ? '💸 Expense' : '↔ Transfer'}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="psp__qp-field psp__qp-field--amt">
          <label className="psp__qp-label">Amount</label>
          <div className="psp__qp-amt-wrap">
            <span className="psp__qp-sym">₹</span>
            <input
              type="number"
              className="psp__qp-amt"
              value={amount}
              min={1}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Actions — inline at end of row */}
        <div className="psp__qp-field psp__qp-field--actions">
          <label className="psp__qp-label">&nbsp;</label>
          <div className="psp__qp-btns">
            <button
              type="button"
              className="psp__qp-cancel"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              className="psp__qp-pay"
              onClick={handlePay}
              disabled={isPending || !canPay}
            >
              {isPending ? 'Logging…' : `Pay ${fmt(amount)} →`}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm summary line */}
      {canPay && !isPending && (
        <p className="psp__qp-summary">
          {txType === 'EXPENSE' ? (
            <>
              Log <strong>{fmt(amount)}</strong> expense from <strong>{src?.name}</strong> →{' '}
              <strong>{item.name}</strong>
            </>
          ) : (
            <>
              Transfer <strong>{fmt(amount)}</strong> from <strong>{src?.name}</strong> →{' '}
              <strong>{sources.find((s) => s.id === toId)?.name}</strong>
            </>
          )}
        </p>
      )}

      {/* Fallback for payments made outside the app (already reconciled elsewhere,
          paid via a channel this app doesn't track, etc.) — settles without a transaction. */}
      <button
        type="button"
        className="psp__qp-mark-paid"
        onClick={onMarkPaidOnly}
        disabled={isPending || markingPaid}
      >
        {markingPaid ? 'Marking as paid…' : "Already paid this — just mark it, don't log a transaction"}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export interface PaymentSchedulePanelProps {
  groups: BudgetGroup[];
  monthLabel: string;
  year: number;
  month: number;
  todayDay?: number;
  isFutureMonth?: boolean;
  /** When true, hides the header — use when the parent provides its own header (e.g. summary bar card) */
  headless?: boolean;
}

export const PaymentSchedulePanel = memo(function PaymentSchedulePanel({
  groups,
  monthLabel,
  year,
  month,
  todayDay = new Date().getDate(),
  isFutureMonth = false,
  headless = false,
}: PaymentSchedulePanelProps) {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const { mutateAsync: voidTx, isPending: isVoiding } = useVoidTransaction();
  const updatePlan = useUpdateBudgetPlan(year, month);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch {
      /* ssr */
    }
  }, [open]);

  // Fetch payment sources when body is visible (headless always shows body)
  const { data: sourcesData } = useQuery<PaymentSourceOption[]>({
    queryKey: queryKeys.paymentSources.list(),
    queryFn: () => apiGetV1<PaymentSourceOption[]>('/api/v1/payment-sources'),
    enabled: headless || open,
    staleTime: 60_000,
  });
  const sources = sourcesData ?? [];

  const items = useMemo(() => derivePayments(groups), [groups]);
  const statusOf = useMemo(
    () => (item: DuePaymentItem) => getStatus(item, todayDay, isFutureMonth),
    [todayDay, isFutureMonth],
  );

  const { counts, totalUnpaid } = useMemo(() => {
    const c: Record<PaymentStatus, number> = { overdue: 0, soon: 0, upcoming: 0, paid: 0 };
    let unpaid = 0;
    for (const item of items) {
      const s = statusOf(item);
      c[s]++;
      if (s !== 'paid') unpaid += item.amount;
    }
    return { counts: c, totalUnpaid: unpaid };
  }, [items, statusOf]);

  const visibleItems = useMemo(
    () => (selectedDay ? items.filter((i) => i.dueDay === selectedDay) : items),
    [items, selectedDay],
  );

  if (items.length === 0) return null;

  const activeChips = (['overdue', 'soon', 'upcoming', 'paid'] as PaymentStatus[]).filter(
    (s) => counts[s] > 0,
  );

  function handleDayClick(day: number) {
    setSelectedDay((prev) => (prev === day ? null : day));
    setPayingId(null);
  }

  function handleToggle() {
    setOpen((v) => {
      if (v) {
        setSelectedDay(null);
        setPayingId(null);
      }
      return !v;
    });
  }

  // In headless mode the parent owns the header and open/close state — always show body
  const showBody = headless || open;

  return (
    <div className={`psp${headless ? ' psp--headless' : ''}`}>
      {/* ── Header (hidden in headless mode) ── */}
      {!headless && (
        <div className="psp__header">
          <span className="psp__meta">
            <span className="psp__label">PAYMENTS</span>
            <span className="psp__sep" aria-hidden>
              ·
            </span>
            <span className="psp__month">{monthLabel}</span>
          </span>

          <span className="psp__chips">
            {activeChips.map((status) => (
              <span key={status} className={`psp__chip psp__chip--${status}`}>
                <span className="psp__chip-dot" style={{ background: STATUS_HEX[status] }} />
                <span className="psp__chip-n">{counts[status]}</span>
                <span className="psp__chip-lbl">{STATUS_LABELS[status]}</span>
              </span>
            ))}
          </span>

          <span className="psp__header-right">
            {totalUnpaid > 0 && <span className="psp__remaining">{fmt(totalUnpaid)} left</span>}
            <button
              type="button"
              className="psp__toggle"
              aria-expanded={open}
              aria-label={open ? 'Collapse' : 'Expand'}
              onClick={handleToggle}
            >
              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </span>
        </div>
      )}

      {/* ── Body ── */}
      {showBody && (
        <div className="psp__body">
          {/* Timeline */}
          <div className="psp__tl-wrap">
            <Timeline
              items={items}
              todayDay={todayDay}
              statusOf={statusOf}
              selectedDay={selectedDay}
              onDayClick={handleDayClick}
            />
            {selectedDay && (
              <button type="button" className="psp__tl-clear" onClick={() => setSelectedDay(null)}>
                Show all
              </button>
            )}
          </div>

          {/* List */}
          <ul className="psp__list">
            {visibleItems.map((item) => {
              const status = statusOf(item);
              const daysUntil = isFutureMonth ? null : item.dueDay - todayDay;
              const badge =
                status === 'paid'
                  ? 'Paid'
                  : status === 'overdue'
                    ? `${Math.abs(daysUntil!)}d overdue`
                    : daysUntil === 0
                      ? 'Due today'
                      : daysUntil != null
                        ? `in ${daysUntil}d`
                        : null;

              const isPaying = payingId === item.id;
              // Server-driven, not session-local — survives a refresh, and covers both a
              // Quick Pay-linked settlement and a pure manual "mark as paid" alike.
              const canUndo = item.isSettled;

              function handleUndo() {
                // Unsettle first — that's the correctness-critical part (item goes back to
                // due/overdue). Voiding the linked transaction, if any, is secondary cleanup;
                // if it fails, the item is still correctly showing as unpaid rather than
                // silently staying marked paid.
                void updatePlan
                  .mutateAsync({ categoryId: item.id, data: { settled: false } })
                  .then(() => {
                    if (item.settledTransactionId) void voidTx(item.settledTransactionId);
                  });
              }

              return (
                <li key={item.id} className={`psp__item${isPaying ? ' psp__item--paying' : ''}`}>
                  {/* Row */}
                  <div className="psp__row" data-status={status}>
                    <span className="psp__row-dot" style={{ background: STATUS_HEX[status] }} />
                    <span className="psp__row-day">
                      {item.dueDay}
                      <sup>{ordinal(item.dueDay)}</sup>
                    </span>
                    <span className="psp__row-name" title={item.name}>
                      {item.name}
                    </span>
                    <span className="psp__row-amt">{item.amount > 0 ? fmt(item.amount) : '—'}</span>
                    {badge && (
                      <span className={`psp__row-badge psp__row-badge--${status}`}>{badge}</span>
                    )}
                    {/* Undo button — only for payments made in this session */}
                    {canUndo && (
                      <button
                        type="button"
                        className="psp__row-undo"
                        onClick={handleUndo}
                        disabled={isVoiding}
                        aria-label={`Undo payment for ${item.name}`}
                      >
                        ↩ Undo
                      </button>
                    )}
                    {/* Pay button — always in DOM, opacity controlled by CSS on item hover */}
                    {status !== 'paid' && (
                      <button
                        type="button"
                        className={`psp__row-pay${isPaying ? ' psp__row-pay--on' : ''}`}
                        onClick={() => setPayingId(isPaying ? null : item.id)}
                        aria-expanded={isPaying}
                        aria-label={isPaying ? 'Cancel' : `Pay ${item.name}`}
                      >
                        {isPaying ? <X size={11} /> : 'Pay'}
                      </button>
                    )}
                  </div>

                  {/* Inline quick-pay accordion */}
                  {isPaying && (
                    <QuickPay
                      item={item}
                      year={year}
                      month={month}
                      todayDay={todayDay}
                      sources={sources}
                      onCancel={() => setPayingId(null)}
                      onSuccess={(txId) => {
                        void updatePlan.mutateAsync({
                          categoryId: item.id,
                          data: { settled: true, settledTransactionId: txId },
                        });
                        setPayingId(null);
                      }}
                      onMarkPaidOnly={() => {
                        void updatePlan
                          .mutateAsync({ categoryId: item.id, data: { settled: true } })
                          .then(() => setPayingId(null));
                      }}
                      markingPaid={updatePlan.isPending}
                    />
                  )}
                </li>
              );
            })}

            {visibleItems.length === 0 && selectedDay && (
              <li className="psp__empty">
                No payments on the {selectedDay}
                {ordinal(selectedDay)}.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
});
