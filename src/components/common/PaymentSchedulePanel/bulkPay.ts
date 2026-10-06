import type { TransactionBody } from '@/hooks/useTransactions';
import type { PaymentSourceOption } from '@/types/finance';
import type { DuePaymentItem } from './derivePayments';

/** Transaction type a bill in this budget group is paid with — null when the group
 *  isn't something you pay (income arrives, transfers have their own flow). */
export function txTypeForGroup(groupType: string): 'EXPENSE' | 'INVESTMENT' | null {
  if (groupType === 'EXPENSE') return 'EXPENSE';
  if (groupType === 'INVESTMENT') return 'INVESTMENT';
  return null;
}

/** What's actually left on the bill — a partially-paid ₹2,000 bill with ₹1,950 already
 *  logged defaults to ₹50, not to double-paying the full amount. */
export function defaultPayAmount(item: DuePaymentItem): number {
  return item.partial ? item.remaining : item.amount;
}

export function payMethod(src: PaymentSourceOption): string {
  switch (src.type) {
    case 'CREDIT_CARD':
      return 'CREDIT_CARD';
    case 'DEBIT_CARD':
      return 'DEBIT_CARD';
    case 'WALLET':
      return 'WALLET';
    default:
      return 'UPI';
  }
}

export function todayISO(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

interface BuildArgs {
  item: DuePaymentItem;
  source: PaymentSourceOption;
  amount: number;
  /** Budget period the bill belongs to — independent of the logged `date`. */
  year: number;
  month: number;
  date: string;
}

export function buildBillTransaction({
  item,
  source,
  amount,
  year,
  month,
  date,
}: BuildArgs): TransactionBody {
  return {
    type: txTypeForGroup(item.groupType) ?? 'EXPENSE',
    date,
    budgetPeriodYear: year,
    budgetPeriodMonth: month,
    amount,
    merchant: item.name,
    categoryId: item.id,
    paymentSourceId: source.id,
    paymentMethod: payMethod(source),
    isPlanned: true,
    isRecurring: false,
  };
}

// Per-browser convenience only: which account each bill was last paid from, so the
// checklist pre-fills it. Losing it just falls back to the first account.
const LAST_SOURCE_KEY = 'psp-last-source';

export function readLastSources(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LAST_SOURCE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function rememberSource(categoryId: string, sourceId: string): void {
  try {
    const map = readLastSources();
    map[categoryId] = sourceId;
    localStorage.setItem(LAST_SOURCE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable */
  }
}
