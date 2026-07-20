import type { RecurringFrequency } from '@prisma/client';

/** How many months between occurrences for each frequency — the single source of truth
 *  for converting between "amount per occurrence" and "monthly-equivalent amount".
 *  Shared by the Subscription Audit widget and Budget planning so the two never drift. */
export const FREQUENCY_INTERVAL_MONTHS: Record<RecurringFrequency, number> = {
  MONTHLY: 1,
  TWICE_MONTHLY: 0.5,
  EVERY_2_MONTHS: 2,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  ANNUAL: 12,
};

/** Per-occurrence amount → monthly-equivalent (e.g. an annual ₹1,200 charge → ₹100/month). */
export function monthlyEquivalent(amount: number, frequency: RecurringFrequency | null): number {
  if (!frequency) return amount;
  return amount / FREQUENCY_INTERVAL_MONTHS[frequency];
}

/** Monthly-equivalent amount → per-occurrence amount (for display: "≈ ₹1,200 when due"). */
export function dueAmountFromMonthly(
  monthlyAmount: number,
  frequency: RecurringFrequency | null,
): number {
  if (!frequency) return monthlyAmount;
  return monthlyAmount * FREQUENCY_INTERVAL_MONTHS[frequency];
}

/** Whether a recurring item with this frequency/due-months is due in the given calendar
 *  month (1-12). MONTHLY (or no frequency) is always due. Any other frequency with no
 *  explicit due months set is treated as NOT due — failing safe instead of defaulting to
 *  "every month", which was the original bug (a half-yearly bill silently budgeted twelve
 *  times a year). */
export function isDueInMonth(
  frequency: RecurringFrequency | null,
  months: number[],
  month: number,
): boolean {
  if (!frequency || frequency === 'MONTHLY') return true;
  return months.includes(month);
}

export const MONTH_LABELS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Full due-months list for a frequency given a single anchor month (1-12) — the month the
 *  first occurrence falls in. Evenly spaces the remaining occurrences from there, e.g.
 *  anchor=March + HALF_YEARLY → [March, September]. MONTHLY/TWICE_MONTHLY don't need
 *  explicit months (isDueInMonth treats them as always-due), so this returns []. */
export function monthsFromAnchor(frequency: RecurringFrequency, anchorMonth: number): number[] {
  const interval = FREQUENCY_INTERVAL_MONTHS[frequency];
  if (interval <= 1) return [];
  const count = Math.round(12 / interval);
  const months: number[] = [];
  let m = anchorMonth;
  for (let i = 0; i < count; i++) {
    months.push(m);
    m = ((m - 1 + interval) % 12) + 1;
  }
  return months.sort((a, b) => a - b);
}
