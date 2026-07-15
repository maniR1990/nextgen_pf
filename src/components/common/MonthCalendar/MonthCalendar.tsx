'use client';

import { addMonths, format, getDay, getDaysInMonth, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export interface CalendarTransaction {
  id: string;
  merchant: string;
  amount: number;
  type: 'debit' | 'credit' | 'neutral';
  category?: string;
}

export interface MonthCalendarProps {
  month: number;
  year: number;
  transactions?: Record<string, CalendarTransaction[]>;
  onDayClick?: (date: string) => void;
  onMonthChange?: (month: number, year: number) => void;
  onAddTransaction?: (date: string) => void;
  selectedDate?: string | null;
  /** ISO dates ('YYYY-MM-DD') with no expense that day — given a subtle highlight. */
  noSpendDates?: string[];
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MAX_DOTS = 3;

function buildGrid(year: number, month: number) {
  const firstDay = getDay(new Date(year, month, 1));
  const total = getDaysInMonth(new Date(year, month, 1));
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function formatAmount(tx: CalendarTransaction) {
  const prefix = tx.type === 'debit' ? '−' : tx.type === 'credit' ? '+' : '';
  return `${prefix}₹${tx.amount.toLocaleString('en-IN')}`;
}

function computeDayTotal(txs: CalendarTransaction[]) {
  let credits = 0;
  let debits = 0;
  for (const tx of txs) {
    if (tx.type === 'credit') credits += tx.amount;
    else if (tx.type === 'debit') debits += tx.amount;
  }
  return { credits, debits, net: credits - debits };
}

export function MonthCalendar({
  month,
  year,
  transactions = {},
  onDayClick,
  onMonthChange,
  onAddTransaction,
  selectedDate,
  noSpendDates = [],
}: MonthCalendarProps) {
  const noSpendSet = new Set(noSpendDates);
  const [viewMonth, setViewMonth] = useState(month - 1);
  const [viewYear, setViewYear] = useState(year);

  function prevMonth() {
    const d = addMonths(new Date(viewYear, viewMonth, 1), -1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    onMonthChange?.(d.getMonth() + 1, d.getFullYear());
  }

  function nextMonth() {
    const d = addMonths(new Date(viewYear, viewMonth, 1), 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    onMonthChange?.(d.getMonth() + 1, d.getFullYear());
  }

  const cells = buildGrid(viewYear, viewMonth);
  const selectedTxs = selectedDate ? (transactions[selectedDate] ?? []) : [];
  const dayTotals = selectedTxs.length > 0 ? computeDayTotal(selectedTxs) : null;

  const panelDateLabel = selectedDate ? format(parseISO(selectedDate), 'MMM d').toUpperCase() : '';

  return (
    <div className="month-cal">
      {/* Navigation */}
      <div className="month-cal__nav">
        <button
          type="button"
          className="month-cal__nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="month-cal__nav-label">
          {format(new Date(viewYear, viewMonth, 1), 'MMMM yyyy')}
        </span>
        <button
          type="button"
          className="month-cal__nav-btn"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Calendar grid */}
      <div
        className="month-cal__grid"
        role="grid"
        aria-label={format(new Date(viewYear, viewMonth, 1), 'MMMM yyyy')}
      >
        {WEEKDAYS.map((w) => (
          <div key={w} className="month-cal__weekday" role="columnheader">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (!day) {
            return (
              <div key={`e-${i}`} className="month-cal__day month-cal__day--empty" aria-hidden />
            );
          }
          const iso = format(new Date(viewYear, viewMonth, day), 'yyyy-MM-dd');
          const todayDate = new Date(viewYear, viewMonth, day);
          const txs = transactions[iso] ?? [];
          const isSelected = selectedDate === iso;
          const overflowCount = txs.length > MAX_DOTS ? txs.length - MAX_DOTS : 0;

          const cls = [
            'month-cal__day',
            isToday(todayDate) && !isSelected ? 'month-cal__day--today' : '',
            isSelected ? 'month-cal__day--selected' : '',
            noSpendSet.has(iso) && !isSelected ? 'month-cal__day--no-spend' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={day}
              type="button"
              className={cls}
              role="gridcell"
              aria-label={`${format(todayDate, 'MMMM d, yyyy')}${txs.length ? `, ${txs.length} transactions` : ''}`}
              aria-pressed={isSelected}
              onClick={() => onDayClick?.(iso)}
            >
              <span className="month-cal__day-num">{day}</span>
              {txs.length > 0 && (
                <div className="month-cal__dots" aria-hidden>
                  {txs.slice(0, MAX_DOTS).map((tx) => (
                    <div key={tx.id} className={`month-cal__dot month-cal__dot--${tx.type}`} />
                  ))}
                  {overflowCount > 0 && (
                    <span className="month-cal__dot-overflow">+{overflowCount}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selectedDate && (
        <div className="month-cal__panel">
          {/* Desktop: compact summary row */}
          <div className="month-cal__panel-summary">
            <div className="month-cal__panel-summary-left">
              <span className="month-cal__panel-date-label">{panelDateLabel}</span>
              <span className="month-cal__panel-separator">·</span>
              <span className="month-cal__panel-tx-count">Transactions</span>
            </div>
            <div className="month-cal__panel-summary-right">
              <span className="month-cal__panel-count">{selectedTxs.length} transactions</span>
              {dayTotals && (
                <span
                  className={`month-cal__panel-total month-cal__panel-total--${dayTotals.net >= 0 ? 'credit' : 'debit'}`}
                >
                  {dayTotals.net >= 0
                    ? `+₹${dayTotals.net.toLocaleString('en-IN')}`
                    : `−₹${Math.abs(dayTotals.net).toLocaleString('en-IN')}`}
                </span>
              )}
            </div>
          </div>

          {/* Mobile: individual transaction rows */}
          <div className="month-cal__panel-rows">
            {selectedTxs.length === 0 ? (
              <div className="month-cal__panel-empty">No transactions</div>
            ) : (
              selectedTxs.map((tx) => (
                <div key={tx.id} className="month-cal__panel-tx">
                  <span
                    className={`month-cal__panel-tx-dot month-cal__panel-tx-dot--${tx.type}`}
                    aria-hidden
                  />
                  <span className="month-cal__panel-tx-merchant">{tx.merchant}</span>
                  <span
                    className={`month-cal__panel-tx-amount month-cal__panel-tx-amount--${tx.type}`}
                  >
                    {formatAmount(tx)}
                  </span>
                </div>
              ))
            )}
          </div>

          {onAddTransaction && (
            <button
              type="button"
              className="month-cal__panel-add"
              onClick={() => onAddTransaction(selectedDate)}
            >
              + Add transaction
            </button>
          )}
        </div>
      )}
    </div>
  );
}
