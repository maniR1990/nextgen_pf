export interface PeriodSuggestion {
  year: number;
  month: number; // 1-indexed
  label: string;
  recommended: boolean;
  reason: string;
}

export interface IncomePeriodData {
  suggestions: PeriodSuggestion[];
  bankDateHint: string | null;
  defaultYear: number;
  defaultMonth: number;
}

function getLastWorkingDayOfMonth(year: number, month: number): Date {
  // new Date(year, month, 0) = last calendar day of 1-indexed month
  const d = new Date(year, month, 0);
  const dow = d.getDay();
  if (dow === 0) d.setDate(d.getDate() - 2); // Sun → Fri
  else if (dow === 6) d.setDate(d.getDate() - 1); // Sat → Fri
  return d;
}

function fmtMonthYear(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function getIncomePeriodData(dateStr: string): IncomePeriodData {
  // Parse as local date (avoid UTC day-shift)
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  const lwd = getLastWorkingDayOfMonth(y, m);
  const isLWD = date.getDate() === lwd.getDate();
  const lastCalDay = new Date(y, m, 0).getDate();
  const isNearEnd = date.getDate() >= lastCalDay - 4;

  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;

  const monthName = date.toLocaleString('en-IN', { month: 'long' });
  const nextMonthName = new Date(nextYear, nextMonth - 1, 1).toLocaleString('en-IN', { month: 'long' });

  const recommendNext = isNearEnd;

  const nextMonthSuggestion: PeriodSuggestion = {
    year: nextYear,
    month: nextMonth,
    label: fmtMonthYear(nextYear, nextMonth),
    recommended: recommendNext,
    reason: `Salary received ${d} ${monthName} — funds all ${nextMonthName} expenses`,
  };
  const currentMonthSuggestion: PeriodSuggestion = {
    year: y,
    month: m,
    label: fmtMonthYear(y, m),
    recommended: !recommendNext,
    reason: `Count this in ${monthName}'s budget (same-month)`,
  };
  // Recommended suggestion is always first so array fallbacks land on the right default
  const suggestions: PeriodSuggestion[] = recommendNext
    ? [nextMonthSuggestion, currentMonthSuggestion]
    : [currentMonthSuggestion, nextMonthSuggestion];

  const defaultSuggestion = suggestions.find((s) => s.recommended) ?? suggestions[0];

  return {
    suggestions,
    bankDateHint: isLWD ? `Last working day of ${monthName}` : null,
    defaultYear: defaultSuggestion.year,
    defaultMonth: defaultSuggestion.month,
  };
}

export function formatAmountShort(amountStr: string): string {
  const n = parseFloat(amountStr);
  if (!n || isNaN(n) || n <= 0) return '';
  if (n >= 100000) return `+₹${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  if (n >= 1000) return `+₹${Math.round(n / 1000)}K`;
  return `+₹${n.toLocaleString('en-IN')}`;
}
