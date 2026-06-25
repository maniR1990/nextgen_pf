import { FISCAL_YEAR_START_MONTH } from '@/constants/dates';
import { getMonth, getYear, setMonth, setYear, startOfMonth } from 'date-fns';
import type { DateInput } from './formatDate';

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Returns the fiscal year label for a given date (US federal: Oct–Sep). */
export function getFiscalYear(value: DateInput): number {
  const date = toDate(value);
  const month = getMonth(date) + 1;
  const year = getYear(date);
  return month >= FISCAL_YEAR_START_MONTH ? year + 1 : year;
}

/** Start of the fiscal year containing the given date. */
export function getFiscalYearStart(value: DateInput): Date {
  const fy = getFiscalYear(value);
  return startOfMonth(setMonth(setYear(new Date(0), fy - 1), FISCAL_YEAR_START_MONTH - 1));
}

export function formatFiscalPeriod(value: DateInput): string {
  const fy = getFiscalYear(value);
  return `FY${fy}`;
}

export function formatFiscalQuarter(value: DateInput): string {
  const date = toDate(value);
  const month = getMonth(date) + 1;
  const offset = (month - FISCAL_YEAR_START_MONTH + 12) % 12;
  const quarter = Math.floor(offset / 3) + 1;
  return `Q${quarter} ${formatFiscalPeriod(date)}`;
}
