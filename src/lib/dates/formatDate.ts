import { format as dateFnsFormat, parseISO } from 'date-fns';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
import {
  DATE_FORMAT_ISO,
  DATE_FORMAT_LONG,
  DATE_FORMAT_MONTH_YEAR,
  DATE_FORMAT_SHORT,
} from '@/constants/dates';

export type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string') return parseISO(value);
  return new Date(value);
}

/** Primary formatter — date-fns with project presets. */
export function formatDate(value: DateInput, pattern: string = DATE_FORMAT_SHORT): string {
  return dateFnsFormat(toDate(value), pattern);
}

export function formatDateLong(value: DateInput): string {
  return formatDate(value, DATE_FORMAT_LONG);
}

export function formatDateIso(value: DateInput): string {
  return formatDate(value, DATE_FORMAT_ISO);
}

export function formatMonthYear(value: DateInput): string {
  return formatDate(value, DATE_FORMAT_MONTH_YEAR);
}

/** Relative / lightweight formatting via dayjs. */
export function formatRelative(value: DateInput): string {
  return dayjs(toDate(value)).fromNow();
}

export function daysSince(value: DateInput): number {
  return dayjs().diff(dayjs(toDate(value)), 'day');
}
