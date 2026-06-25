'use client';

import { Package, Monitor } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';

// ── Public types (JSON-shaped input) ──────────────────────────────────────

export type TxType = 'debit' | 'credit';

export interface TimelineTx {
  id: string;
  merchant: string;
  /** e.g. "Groceries · UPI" */
  subtitle: string;
  amount: number;
  type: TxType;
}

export interface TimelineTxGroup {
  /** ISO date string, e.g. "2024-06-12" */
  date: string;
  transactions: TimelineTx[];
}

export interface TransactionTimelineTWProps {
  groups: TimelineTxGroup[];
  onLoadMore?: () => void;
  hasMore?: boolean;
}

// ── Demo / default data ───────────────────────────────────────────────────

export const DEMO_GROUPS: TimelineTxGroup[] = [
  {
    date: '2024-06-12',
    transactions: [
      { id: '1', merchant: 'BigBasket',          subtitle: 'Groceries · UPI',       amount: -1245,  type: 'debit'  },
      { id: '2', merchant: 'HDFC SIP',            subtitle: 'SIP / MF · Auto Debit', amount: -60000, type: 'debit'  },
    ],
  },
  {
    date: '2024-06-11',
    transactions: [
      { id: '3', merchant: 'Swiggy',              subtitle: 'Dining Out · UPI',      amount: -380,   type: 'debit'  },
      { id: '4', merchant: 'PhonePe',             subtitle: 'Fuel · UPI',            amount: -1000,  type: 'debit'  },
    ],
  },
  {
    date: '2024-06-10',
    transactions: [
      { id: '5', merchant: 'Salary — Acme Corp',  subtitle: 'Income · NEFT',         amount: 220000, type: 'credit' },
    ],
  },
  {
    date: '2024-06-09',
    transactions: [
      { id: '6', merchant: 'Amazon',              subtitle: 'Electronics · Card',    amount: -2499,  type: 'debit'  },
      { id: '7', merchant: 'Jio Fiber',           subtitle: 'Internet · Auto Debit', amount: -999,   type: 'debit'  },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

const TAGS = [
  { label: 'react-chrono',                      variant: 'red'  as const },
  { label: 'react-vertical-timeline-component', variant: 'blue' as const },
  { label: 'react-virtual',                     variant: 'blue' as const },
  { label: 'date-fns',                          variant: 'blue' as const },
];

function fmtDate(iso: string) {
  try { return format(parseISO(iso), 'MMM d'); } catch { return iso; }
}

function fmtAmount(tx: TimelineTx) {
  const abs = Math.abs(tx.amount).toLocaleString('en-IN');
  return tx.type === 'credit' ? `+₹${abs}` : `−₹${abs}`;
}

// ── Shared style overrides for react-vertical-timeline-component ──────────

const ICON_STYLE: React.CSSProperties = {
  background: '#f1f5f9', // slate-100 — invisible against bg
  boxShadow: 'none',
  border: '1px solid #e2e8f0',
  width: '10px',
  height: '10px',
  marginLeft: '-5px',
  marginTop: '12px',
};

const CONTENT_STYLE: React.CSSProperties = {
  background: 'transparent',
  boxShadow: 'none',
  padding: 0,
  border: 'none',
};

const ARROW_STYLE: React.CSSProperties = { display: 'none' };

// ── Transaction card ──────────────────────────────────────────────────────

function TxCard({ tx }: { tx: TimelineTx }) {
  return (
    <div className="flex justify-between items-center w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={[
            'w-2 h-2 rounded-full shrink-0',
            tx.type === 'credit' ? 'bg-green-500' : 'bg-red-500',
          ].join(' ')}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 leading-tight truncate">
            {tx.merchant}
          </p>
          <p className="text-xs text-slate-400 leading-tight mt-0.5 truncate">
            {tx.subtitle}
          </p>
        </div>
      </div>
      <span
        className={[
          'text-sm font-semibold shrink-0 ml-6 tabular-nums',
          tx.type === 'credit' ? 'text-green-600' : 'text-red-500',
        ].join(' ')}
      >
        {fmtAmount(tx)}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export function TransactionTimelineTW({
  groups,
  onLoadMore,
  hasMore = false,
}: TransactionTimelineTWProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-slate-50 rounded-2xl font-sans">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-2">
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold font-mono bg-blue-50 text-blue-500 border border-blue-200 leading-none">
          05
        </span>
        <h1 className="text-2xl font-bold text-slate-800 leading-none">
          Transaction Timeline
        </h1>
      </div>

      <p className="text-sm text-slate-500 leading-relaxed mb-4">
        Chronological list of transactions grouped by date. Left column = date axis with connector
        line. Right column = transaction cards. Mobile: sticky date headers with net-day total.
      </p>

      {/* Tech-stack tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {TAGS.map(tag => (
          <span
            key={tag.label}
            className={[
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono border',
              tag.variant === 'red'
                ? 'bg-red-50 text-red-400 border-red-200'
                : 'bg-sky-50 text-sky-500 border-sky-200',
            ].join(' ')}
          >
            <Package size={10} aria-hidden />
            {tag.label}
          </span>
        ))}
      </div>

      {/* Desktop label */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">
        <Monitor size={12} aria-hidden />
        Desktop
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-8">No transactions to display.</p>
      )}

      {/* Timeline — powered by react-vertical-timeline-component */}
      {groups.length > 0 && (
        <VerticalTimeline
          layout="1-column-right"
          lineColor="#e2e8f0"
          className="!py-0 !before:left-0"
        >
          {groups.map(group => (
            <VerticalTimelineElement
              key={group.date}
              date={fmtDate(group.date)}
              dateClassName="!text-blue-600 !font-semibold !text-xs !opacity-100 !p-0 !pt-2.5 !leading-none"
              icon={<span />}
              iconStyle={ICON_STYLE}
              contentStyle={CONTENT_STYLE}
              contentArrowStyle={ARROW_STYLE}
              className="!pb-6"
            >
              <div className="flex flex-col gap-2">
                {group.transactions.map(tx => (
                  <TxCard key={tx.id} tx={tx} />
                ))}
              </div>
            </VerticalTimelineElement>
          ))}

          {/* Footer: faded dot + load more */}
          <VerticalTimelineElement
            icon={<span className="absolute inset-0 rounded-full bg-slate-300" />}
            iconStyle={{
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              width: '8px',
              height: '8px',
              marginLeft: '-4px',
              marginTop: '6px',
            }}
            contentStyle={CONTENT_STYLE}
            contentArrowStyle={ARROW_STYLE}
            className="!pb-0"
          >
            {hasMore ? (
              <button
                type="button"
                onClick={onLoadMore}
                className="text-xs italic text-slate-400 hover:text-blue-500 transition-colors pt-0.5"
              >
                Load older transactions...
              </button>
            ) : (
              <span className="text-xs italic text-slate-400 pt-0.5">
                Load older transactions...
              </span>
            )}
          </VerticalTimelineElement>
        </VerticalTimeline>
      )}
    </div>
  );
}
