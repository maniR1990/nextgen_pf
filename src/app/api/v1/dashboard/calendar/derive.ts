export interface DuePaymentInput {
  dueDay: number;
  name: string;
  amount: number;
  paid: boolean;
}

export interface CalendarBudgetPace {
  plannedTotal: number;
  actualTotal: number;
  dayOfMonth: number;
  totalDays: number;
  /** actual / planned * 100, rounded. 0 when nothing is planned. */
  spendPct: number;
  /** dayOfMonth / totalDays * 100, rounded. */
  timePct: number;
}

export interface CalendarBillDue {
  day: number;
  name: string;
  amount: number;
  paid: boolean;
}

export interface CalendarData {
  noSpendDays: number[];
  incomeDays: number[];
  billDue: CalendarBillDue[];
  /** Longest run of consecutive no-spend days within the elapsed part of the month. */
  bestStreak: number;
  budgetPace: CalendarBudgetPace;
}

export interface DeriveCalendarDataInput {
  /** Last elapsed day of the month to consider — today's day-of-month for the current
   *  month, `totalDays` for a past month, 0 for a future month. */
  dayOfMonth: number;
  totalDays: number;
  expenseDays: number[];
  incomeDays: number[];
  duePayments: DuePaymentInput[];
  plannedTotal: number;
  actualTotal: number;
}

/** Pure derivation of the dashboard calendar's day-level view from already-fetched
 *  aggregates — kept separate from data fetching so the no-spend/streak/pace logic is
 *  unit-testable without a database. */
export function deriveCalendarData({
  dayOfMonth,
  totalDays,
  expenseDays,
  incomeDays,
  duePayments,
  plannedTotal,
  actualTotal,
}: DeriveCalendarDataInput): CalendarData {
  const expenseDaySet = new Set(expenseDays);

  const noSpendDays: number[] = [];
  let bestStreak = 0;
  let currentStreak = 0;
  for (let day = 1; day <= dayOfMonth; day++) {
    if (expenseDaySet.has(day)) {
      currentStreak = 0;
      continue;
    }
    noSpendDays.push(day);
    currentStreak += 1;
    bestStreak = Math.max(bestStreak, currentStreak);
  }

  const billDue = duePayments
    .map((p) => ({ day: p.dueDay, name: p.name, amount: p.amount, paid: p.paid }))
    .sort((a, b) => a.day - b.day);

  const spendPct = plannedTotal > 0 ? Math.round((actualTotal / plannedTotal) * 100) : 0;
  const timePct = totalDays > 0 ? Math.round((dayOfMonth / totalDays) * 100) : 0;

  return {
    noSpendDays,
    incomeDays: [...incomeDays].sort((a, b) => a - b),
    billDue,
    bestStreak,
    budgetPace: { plannedTotal, actualTotal, dayOfMonth, totalDays, spendPct, timePct },
  };
}
