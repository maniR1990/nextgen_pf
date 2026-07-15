'use client';

import type { CalendarTransaction } from '@/components/common/MonthCalendar';
import { MonthCalendar } from '@/components/common/MonthCalendar';
import { useDashboardCalendar } from '@/hooks/useDashboardCalendar';
import { useState } from 'react';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Only EXPENSE reads as a debit dot and only genuine inflow types read as credit —
// everything else (transfers, investments, ATM withdrawals, etc.) is neutral, matching
// the same categorisation used server-side for the no-spend/budget-pace figures.
const CREDIT_TYPES = new Set(['INCOME', 'GIFT_RECEIVED', 'REFUND', 'REIMBURSEMENT', 'INSURANCE_CLAIM']);
function toDotKind(type: string): CalendarTransaction['type'] {
  if (type === 'EXPENSE') return 'debit';
  if (CREDIT_TYPES.has(type)) return 'credit';
  return 'neutral';
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function DashboardCalendarWidget() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data, isLoading, isError } = useDashboardCalendar(year, month);

  if (isLoading) {
    return (
      <div className="card dashboard-calendar-widget">
        <p className="dashboard-calendar-widget__status">Loading calendar…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="card dashboard-calendar-widget">
        <p className="dashboard-calendar-widget__status">Couldn't load the calendar.</p>
      </div>
    );
  }

  const noSpendDates = data.noSpendDays.map((day) => toISODate(data.year, data.month, day));

  const transactions: Record<string, CalendarTransaction[]> = {};
  for (const tx of data.transactions) {
    (transactions[tx.date] ??= []).push({
      id: tx.id,
      merchant: tx.merchant ?? tx.categoryName ?? 'Transaction',
      amount: tx.amount,
      type: toDotKind(tx.type),
      category: tx.categoryName ?? undefined,
    });
  }

  const monthLabel = MONTH_LABELS[data.month - 1];
  const { spendPct, timePct } = data.budgetPace;
  const paceVariant = spendPct > timePct ? 'warning' : 'success';

  return (
    <div className="card dashboard-calendar-widget">
      {data.budgetPace.plannedTotal > 0 && (
        <div className={`progress progress--${paceVariant} dashboard-calendar-widget__pace`}>
          <div className="progress__header">
            <span className="progress__label">Budget pace</span>
            <span className="progress__value">
              {spendPct}% spent · {timePct}% of month
            </span>
          </div>
          <div className="progress__track">
            <div className="progress__bar" style={{ width: `${Math.min(spendPct, 100)}%` }} />
          </div>
        </div>
      )}

      {data.bestStreak > 0 && (
        <p className="dashboard-calendar-widget__streak">
          Best no-spend streak this month: {data.bestStreak} day{data.bestStreak === 1 ? '' : 's'}
        </p>
      )}

      {data.billDue.length > 0 && (
        <div className="dashboard-calendar-widget__bills">
          <p className="dashboard-calendar-widget__section-label">Upcoming bills</p>
          {data.billDue.map((bill) => (
            <div key={`${bill.day}-${bill.name}`} className="dashboard-calendar-widget__bill-row">
              <span>
                {bill.name} · due {monthLabel} {bill.day}
              </span>
              <span className={`badge badge--${bill.paid ? 'success' : 'inactive'}`}>
                {bill.paid ? 'Paid' : `₹${bill.amount.toLocaleString('en-IN')}`}
              </span>
            </div>
          ))}
        </div>
      )}

      <MonthCalendar
        year={year}
        month={month}
        transactions={transactions}
        noSpendDates={noSpendDates}
        selectedDate={selectedDate}
        onDayClick={(date) => setSelectedDate((prev) => (prev === date ? null : date))}
        onMonthChange={(m, y) => {
          setMonth(m);
          setYear(y);
          setSelectedDate(null);
        }}
      />
    </div>
  );
}
