import type { FinanceTransactionRow } from '@/types/finance';
import { describe, expect, it } from 'vitest';
import { groupTransactionsByDate } from './transactionTimeline';

const row = (overrides: Partial<FinanceTransactionRow>): FinanceTransactionRow => ({
  id: '1',
  type: 'EXPENSE',
  date: '2026-06-10T10:00:00.000Z',
  amount: 500,
  merchant: 'BigBasket',
  categoryLabel: 'Groceries',
  sourceLabel: 'HDFC',
  method: 'UPI',
  status: 'PENDING',
  isPlanned: true,
  isRecurring: false,
  tags: [],
  budgetPeriodYear: 2026,
  budgetPeriodMonth: 6,
  createdAt: '2026-06-10T10:00:00.000Z',
  ...overrides,
});

describe('groupTransactionsByDate', () => {
  it('groups rows by calendar date', () => {
    const groups = groupTransactionsByDate([
      row({ id: 'a', date: '2026-06-10' }),
      row({ id: 'b', date: '2026-06-10', merchant: 'Swiggy' }),
      row({ id: 'c', date: '2026-06-09' }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find((g) => g.date === '2026-06-10')?.transactions).toHaveLength(2);
    expect(groups.find((g) => g.date === '2026-06-09')?.transactions).toHaveLength(1);
  });

  it('maps expense amounts to debit type', () => {
    const groups = groupTransactionsByDate([row({ type: 'EXPENSE' })]);
    expect(groups[0]?.transactions[0]?.type).toBe('debit');
  });

  it('maps income amounts to credit type', () => {
    const groups = groupTransactionsByDate([row({ type: 'INCOME', amount: 3200 })]);
    expect(groups[0]?.transactions[0]?.type).toBe('credit');
  });
});
