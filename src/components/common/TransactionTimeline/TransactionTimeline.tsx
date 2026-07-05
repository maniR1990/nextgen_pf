'use client';

import { format, parseISO } from 'date-fns';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface TimelineTransaction {
  id: string;
  merchant: string;
  category: string;
  method: string;
  amount: number;
  type: 'debit' | 'credit' | 'neutral';
  tags?: string[];
  budgetPeriodYear: number;
  budgetPeriodMonth: number;
  sourceLabel?: string;
  toAccountName?: string;
  notes?: string;
  status?: string;
  txType?: string;
}

export interface TimelineGroup {
  date: string;
  transactions: TimelineTransaction[];
}

export interface TimelineSummary {
  totalIncome: number;
  totalExpense: number;
  totalTransfers: number;
  net: number;
}

export interface TransactionTimelineProps {
  groups: TimelineGroup[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onTransactionClick?: (id: string) => void;
  onEditClick?: (id: string) => void;
  onDeleteClick?: (id: string) => void;
  showSummary?: boolean;
  /** Whole-period totals from the server. Falls back to summing `groups` (i.e. only the
   *  rows currently loaded/paginated) when omitted — which under-counts once a period has
   *  more transactions than a single page, so callers with a real period should pass this. */
  summary?: TimelineSummary;
}

function formatAmount(tx: TimelineTransaction) {
  const prefix = tx.type === 'debit' ? '−' : tx.type === 'credit' ? '+' : '';
  return `${prefix}₹${tx.amount.toLocaleString('en-IN')}`;
}

function groupNetTotal(group: TimelineGroup) {
  let net = 0;
  for (const tx of group.transactions) {
    if (tx.type === 'credit') net += tx.amount;
    else if (tx.type === 'debit') net -= tx.amount;
  }
  const prefix = net >= 0 ? '+' : '−';
  return { label: `${prefix}₹${Math.abs(net).toLocaleString('en-IN')}`, positive: net >= 0 };
}

export function TransactionTimeline({
  groups,
  onLoadMore,
  hasMore = false,
  loading = false,
  onTransactionClick,
  onEditClick,
  onDeleteClick,
  showSummary = false,
  summary: summaryProp,
}: TransactionTimelineProps) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [masked, setMasked] = useState(true);
  const computedSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransfers = 0;
    for (const g of groups) {
      for (const tx of g.transactions) {
        if (tx.txType === 'TRANSFER') totalTransfers += tx.amount;
        else if (tx.type === 'credit') totalIncome += tx.amount;
        else if (tx.type === 'debit') totalExpense += tx.amount;
      }
    }
    return { totalIncome, totalExpense, totalTransfers, net: totalIncome - totalExpense };
  }, [groups]);
  const summary = summaryProp ?? computedSummary;

  if (loading) {
    return (
      <div
        className="tx-timeline tx-timeline--loading max-w-4xl mx-auto p-8"
        aria-label="Loading transactions"
      >
        {[1, 2, 3].map((i) => (
          <div key={i} className="tx-timeline__skeleton" aria-hidden>
            <div className="tx-timeline__skeleton-header" />
            <div className="tx-timeline__skeleton-card" />
            <div className="tx-timeline__skeleton-card tx-timeline__skeleton-card--short" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tx-timeline max-w-4xl mx-auto p-8" aria-label="Transaction timeline">
      {/* Summary bar */}
      {showSummary && groups.length > 0 && (
        <div className="tx-timeline__summary">
          <div className="tx-timeline__summary-item">
            <span className="tx-timeline__summary-label">
              Income
              <button
                type="button"
                className="tx-timeline__summary-mask-toggle"
                onClick={() => setMasked((v) => !v)}
                aria-label={masked ? 'Show amounts' : 'Hide amounts'}
              >
                {masked ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
            </span>
            <span className="tx-timeline__summary-value tx-timeline__summary-value--credit">
              {masked ? '••••••' : `+₹${summary.totalIncome.toLocaleString('en-IN')}`}
            </span>
          </div>
          <div className="tx-timeline__summary-divider" />
          <div className="tx-timeline__summary-item">
            <span className="tx-timeline__summary-label">Expense</span>
            <span className="tx-timeline__summary-value tx-timeline__summary-value--debit">
              −₹{summary.totalExpense.toLocaleString('en-IN')}
            </span>
          </div>
          {summary.totalTransfers > 0 && (
            <>
              <div className="tx-timeline__summary-divider" />
              <div className="tx-timeline__summary-item">
                <span className="tx-timeline__summary-label">Transferred</span>
                <span className="tx-timeline__summary-value tx-timeline__summary-value--neutral">
                  ₹{summary.totalTransfers.toLocaleString('en-IN')}
                </span>
              </div>
            </>
          )}
          <div className="tx-timeline__summary-divider" />
          <div className="tx-timeline__summary-item tx-timeline__summary-item--net">
            <span className="tx-timeline__summary-label">
              Net
              <button
                type="button"
                className="tx-timeline__summary-mask-toggle"
                onClick={() => setMasked((v) => !v)}
                aria-label={masked ? 'Show amounts' : 'Hide amounts'}
              >
                {masked ? <Eye size={11} /> : <EyeOff size={11} />}
              </button>
            </span>
            <span
              className={`tx-timeline__summary-value tx-timeline__summary-value--${summary.net >= 0 ? 'credit' : 'debit'}`}
            >
              {masked
                ? '••••••'
                : summary.net >= 0
                  ? `+₹${summary.net.toLocaleString('en-IN')}`
                  : `−₹${Math.abs(summary.net).toLocaleString('en-IN')}`}
            </span>
          </div>
        </div>
      )}

      {groups.length === 0 && <div className="tx-timeline__empty">No transactions to display</div>}

      {/* Timeline groups */}
      <div className="tx-timeline__list">
        {groups.map((group) => {
          const dateLabel = (() => {
            try {
              return format(parseISO(group.date), 'MMM d');
            } catch {
              return group.date;
            }
          })();
          const total = groupNetTotal(group);

          return (
            <div key={group.date} className="tx-timeline__group">
              {/* Desktop left-axis date */}
              <div className="tx-timeline__date-col">
                <time className="tx-timeline__date" dateTime={group.date}>
                  {dateLabel}
                </time>
                <div className="tx-timeline__date-track" aria-hidden />
              </div>

              {/* Cards + mobile sticky header */}
              <div className="tx-timeline__cards-col">
                {/* Mobile: sticky date + net total row */}
                <div className="tx-timeline__mobile-header">
                  <time className="tx-timeline__mobile-date" dateTime={group.date}>
                    {dateLabel}
                  </time>
                  <span
                    className={`tx-timeline__mobile-total tx-timeline__mobile-total--${total.positive ? 'credit' : 'debit'}`}
                  >
                    {total.label}
                  </span>
                </div>

                <div className="tx-timeline__cards-list">
                  {group.transactions.map((tx) => {
                    const isCurrentPeriod =
                      tx.budgetPeriodYear === currentYear && tx.budgetPeriodMonth === currentMonth;
                    const showActions = isCurrentPeriod && (onEditClick || onDeleteClick);

                    return (
                      <div
                        key={tx.id}
                        className={[
                          'tx-timeline__card',
                          `tx-timeline__card--${tx.type}`,
                          onTransactionClick ? 'tx-timeline__card--clickable' : '',
                          showActions ? 'tx-timeline__card--has-actions' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        role={onTransactionClick ? 'button' : undefined}
                        tabIndex={onTransactionClick ? 0 : undefined}
                        onClick={() => onTransactionClick?.(tx.id)}
                        onKeyDown={(e) => {
                          if (onTransactionClick && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onTransactionClick(tx.id);
                          }
                        }}
                        aria-label={
                          onTransactionClick ? `${tx.merchant} ${formatAmount(tx)}` : undefined
                        }
                      >
                        <span
                          className={`tx-timeline__dot tx-timeline__dot--${tx.type}`}
                          aria-hidden
                        />
                        <div className="tx-timeline__card-body">
                          <span className="tx-timeline__card-merchant">{tx.merchant}</span>
                          <span className="tx-timeline__card-subtitle">
                            {tx.txType === 'TRANSFER'
                              ? [tx.category, tx.method].filter(Boolean).join(' · ')
                              : [tx.category, tx.sourceLabel, tx.method]
                                  .filter(Boolean)
                                  .join(' · ')}
                          </span>
                          {tx.notes && <span className="tx-timeline__card-notes">{tx.notes}</span>}
                        </div>
                        <span
                          className={`tx-timeline__card-amount tx-timeline__card-amount--${tx.type}`}
                        >
                          {formatAmount(tx)}
                        </span>
                        {showActions && (
                          <div
                            className="tx-timeline__card-actions"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onEditClick && (
                              <button
                                type="button"
                                className="tx-timeline__card-action"
                                aria-label={`Edit ${tx.merchant}`}
                                onClick={() => onEditClick(tx.id)}
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {onDeleteClick && (
                              <button
                                type="button"
                                className="tx-timeline__card-action tx-timeline__card-action--delete"
                                aria-label={`Delete ${tx.merchant}`}
                                onClick={() => onDeleteClick(tx.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          className="tx-timeline__load-more"
          onClick={onLoadMore}
          aria-label="Load more transactions"
        >
          Load older transactions...
        </button>
      )}
    </div>
  );
}
