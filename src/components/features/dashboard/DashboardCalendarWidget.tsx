'use client';

import type { CalendarTransaction } from '@/components/common/MonthCalendar';
import { MonthCalendar } from '@/components/common/MonthCalendar';
import { Badge } from '@/components/ui/Badge';
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

function money(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
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
  const { plannedTotal, actualTotal, spendPct, timePct, dayOfMonth, totalDays } = data.budgetPace;
  const isAheadOfPace = spendPct > timePct;
  const streakLabel =
    data.bestStreak > 0 ? `${data.bestStreak} day${data.bestStreak === 1 ? '' : 's'}` : '—';

  return (
    <div className="card dashboard-calendar-widget">
      <div className="dashboard-calendar-widget__stats">
        <div className="dashboard-calendar-widget__stat">
          <span className="dashboard-calendar-widget__stat-label">Transactions</span>
          <span className="dashboard-calendar-widget__stat-value">{data.transactions.length}</span>
        </div>
        <div className="dashboard-calendar-widget__stat">
          <span className="dashboard-calendar-widget__stat-label">No-spend</span>
          <span className="dashboard-calendar-widget__stat-value dashboard-calendar-widget__stat-value--success">
            {data.noSpendDays.length} of {dayOfMonth}
          </span>
        </div>
        <div className="dashboard-calendar-widget__stat">
          <span className="dashboard-calendar-widget__stat-label">Best streak</span>
          <span className="dashboard-calendar-widget__stat-value dashboard-calendar-widget__stat-value--success">
            {streakLabel}
          </span>
        </div>
      </div>

      {plannedTotal > 0 && (
        <div className="dashboard-calendar-widget__pace">
          <span className="dashboard-calendar-widget__pace-value">
            {money(actualTotal)} of {money(plannedTotal)} spent ({spendPct}%)
          </span>
          <div className="dashboard-calendar-widget__pace-meta">
            <Badge variant={isAheadOfPace ? 'warning' : 'success'}>
              {isAheadOfPace ? 'Ahead of pace' : 'On pace'}
            </Badge>
            <span className="dashboard-calendar-widget__pace-sub">
              Day {dayOfMonth} of {totalDays} ({timePct}%)
            </span>
          </div>
        </div>
      )}

      {data.billDue.length > 0 && (
        <div className="dashboard-calendar-widget__bills">
          <p className="dashboard-calendar-widget__section-label">Upcoming bills</p>
          {data.billDue.map((bill) => (
            <div key={`${bill.day}-${bill.name}`} className="dashboard-calendar-widget__bill-row">
              <span>
                {bill.name} · due {monthLabel} {bill.day}
              </span>
              <Badge variant={bill.paid ? 'success' : 'inactive'}>
                {bill.paid ? 'Paid' : money(bill.amount)}
              </Badge>
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
