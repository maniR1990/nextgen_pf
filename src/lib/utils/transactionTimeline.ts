import type { TimelineGroup } from '@/components/common/TransactionTimeline';
import { TX_TYPE_META } from '@/constants/finance';
import type { FinanceTransactionRow } from '@/types/finance';
import { format } from 'date-fns';

function toDateKey(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return format(new Date(dateStr), 'yyyy-MM-dd');
}

export function mapRowToTimelineTransaction(row: FinanceTransactionRow) {
  const meta = TX_TYPE_META[row.type];
  return {
    id: row.id,
    merchant: row.merchant ?? meta.label,
    category: row.categoryLabel ?? meta.description,
    method: row.method ?? '',
    amount: row.amount,
    type: meta.amountSign,
    tags: row.tags,
    budgetPeriodYear: row.budgetPeriodYear,
    budgetPeriodMonth: row.budgetPeriodMonth,
  };
}

export function groupTransactionsByDate(rows: FinanceTransactionRow[]): TimelineGroup[] {
  const map = new Map<string, TimelineGroup>();

  for (const row of rows) {
    const dateKey = toDateKey(row.date);
    const existing = map.get(dateKey);
    const tx = mapRowToTimelineTransaction(row);
    if (existing) {
      existing.transactions.push(tx);
    } else {
      map.set(dateKey, { date: dateKey, transactions: [tx] });
    }
  }

  return Array.from(map.values());
}
