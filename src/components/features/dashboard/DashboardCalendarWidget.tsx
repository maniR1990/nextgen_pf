'use client';

import type { CalendarTransaction } from '@/components/common/MonthCalendar';
import { MonthCalendar } from '@/components/common/MonthCalendar';
import { Badge } from '@/components/ui/Badge';
import type { CalendarBillDue } from '@/app/api/v1/dashboard/calendar/derive';
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

interface BillDueGroup {
  day: number;
  bills: CalendarBillDue[];
}

interface WeekGroup {
  label: string;
  days: BillDueGroup[];
  count: number;
  /** What's actually still owed across the week — paid bills contribute 0, a
   *  partially-paid one contributes only its remaining balance. Answers "how much do I
   *  still need to pay this week", not "how much bill activity happened". */
  total: number;
}

/** What's left to pay on this one bill — 0 once paid, the remaining balance if partial,
 *  the full amount otherwise. */
function billOutstanding(bill: CalendarBillDue): number {
  if (bill.paid) return 0;
  return bill.partial ? bill.remaining : bill.amount;
}

// billDue arrives pre-sorted by day, so a same-day run is always contiguous — no need
// to bucket into a Map and re-sort.
function groupBillsByDay(billDue: CalendarBillDue[]): BillDueGroup[] {
  const groups: BillDueGroup[] = [];
  for (const bill of billDue) {
    const last = groups[groups.length - 1];
    if (last && last.day === bill.day) last.bills.push(bill);
    else groups.push({ day: bill.day, bills: [bill] });
  }
  return groups;
}

/**
 * Buckets day-groups into calendar weeks (Sunday-start, matching MonthCalendar's own
 * grid) so "what's due this week" reads as one glance instead of scanning every date.
 * "This week"/"Next week" only apply when the widget is showing the real current
 * month — browsing to a different month via the calendar's prev/next arrows falls back
 * to a plain date-range label, since "this week" has no meaning for a month you're not
 * currently in.
 */
function groupBillsByWeek(
  billDue: CalendarBillDue[],
  year: number,
  month: number,
  monthAbbrev: string,
): WeekGroup[] {
  const dayGroups = groupBillsByDay(billDue);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  const todayWeekIndex = isCurrentMonth
    ? Math.floor((now.getDate() - 1 + firstWeekday) / 7)
    : -1;

  const byWeekIndex = new Map<number, BillDueGroup[]>();
  for (const dayGroup of dayGroups) {
    const weekIndex = Math.floor((dayGroup.day - 1 + firstWeekday) / 7);
    const list = byWeekIndex.get(weekIndex);
    if (list) list.push(dayGroup);
    else byWeekIndex.set(weekIndex, [dayGroup]);
  }

  return [...byWeekIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekIndex, days]) => {
      const rangeStart = weekIndex * 7 - firstWeekday + 1;
      const weekStart = Math.max(1, rangeStart);
      const weekEnd = Math.min(daysInMonth, rangeStart + 6);

      let label: string;
      if (isCurrentMonth && weekIndex === todayWeekIndex) label = 'This week';
      else if (isCurrentMonth && weekIndex === todayWeekIndex + 1) label = 'Next week';
      else label = weekStart === weekEnd ? `${monthAbbrev} ${weekStart}` : `${monthAbbrev} ${weekStart}–${weekEnd}`;

      const allBills = days.flatMap((d) => d.bills);
      return {
        label,
        days,
        count: allBills.length,
        total: allBills.reduce((sum, b) => sum + billOutstanding(b), 0),
      };
    });
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
  const monthAbbrev = monthLabel.slice(0, 3);
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
          {groupBillsByWeek(data.billDue, data.year, data.month, monthAbbrev).map((week) => (
            <div key={week.label} className="dashboard-calendar-widget__week">
              <div className="dashboard-calendar-widget__week-head">
                <span className="dashboard-calendar-widget__week-label">{week.label}</span>
                <span className="dashboard-calendar-widget__week-meta">
                  {week.count} bill{week.count === 1 ? '' : 's'}
                  {week.total > 0 && ` · ${money(week.total)}`}
                </span>
              </div>

              {week.days.map((dayGroup) => {
                // One badge speaks for the whole day even when several bills share
                // it — its color reflects the day as a whole (paid only once
                // everything on it is; a single partial bill is enough to flag it).
                const dayStatus = dayGroup.bills.every((b) => b.paid)
                  ? 'paid'
                  : dayGroup.bills.some((b) => b.partial)
                    ? 'partial'
                    : 'due';

                return (
                  <div key={dayGroup.day} className="dashboard-calendar-widget__day-row">
                    <span
                      className={`dashboard-calendar-widget__day-badge dashboard-calendar-widget__day-badge--${dayStatus}`}
                    >
                      <span className="dashboard-calendar-widget__day-num">{dayGroup.day}</span>
                      <span className="dashboard-calendar-widget__day-mon">{monthAbbrev}</span>
                    </span>

                    <div className="dashboard-calendar-widget__day-bills">
                      {dayGroup.bills.map((bill, i) => (
                        <div
                          key={bill.name}
                          className={`dashboard-calendar-widget__bill-row${i > 0 ? ' dashboard-calendar-widget__bill-row--stacked' : ''}`}
                        >
                          <span className="dashboard-calendar-widget__bill-name">{bill.name}</span>
                          {/* A partially-paid bill (some spend logged, not yet the
                              full planned amount) leads with "Paid" credit for what's
                              already covered, then the actual remaining balance —
                              a bare "₹50 left" would look identical to a fresh ₹50
                              bill with nothing paid on it at all. */}
                          <Badge variant={bill.paid ? 'success' : bill.partial ? 'warning' : 'inactive'}>
                            {bill.paid
                              ? 'Paid'
                              : bill.partial
                                ? `Paid · ${money(bill.remaining)} left`
                                : money(bill.amount)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
