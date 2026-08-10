import { describe, expect, it } from 'vitest';
import { BulkCreateTransactionSchema, CreateTransactionSchema } from './transactions.schema';

const validItem = { categoryId: 'cat1', amount: 805 };

const validPayload = {
  type: 'EXPENSE' as const,
  merchant: 'Sri Ganesh Grocers',
  date: '2026-07-19',
  budgetPeriodYear: 2026,
  budgetPeriodMonth: 7,
  paymentSourceId: 'acc1',
  paymentMethod: 'UPI' as const,
  items: [validItem, { categoryId: 'cat2', amount: 384 }],
};

describe('BulkCreateTransactionSchema', () => {
  it('accepts a valid multi-item payload', () => {
    const result = BulkCreateTransactionSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts a single-item payload (still valid to bulk-log just one)', () => {
    const result = BulkCreateTransactionSchema.safeParse({ ...validPayload, items: [validItem] });
    expect(result.success).toBe(true);
  });

  it('rejects an empty items array', () => {
    const result = BulkCreateTransactionSchema.safeParse({ ...validPayload, items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 50 items', () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ categoryId: `cat${i}`, amount: 10 }));
    const result = BulkCreateTransactionSchema.safeParse({ ...validPayload, items });
    expect(result.success).toBe(false);
  });

  it('accepts exactly 50 items', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ categoryId: `cat${i}`, amount: 10 }));
    const result = BulkCreateTransactionSchema.safeParse({ ...validPayload, items });
    expect(result.success).toBe(true);
  });

  it('rejects an item with a non-positive amount', () => {
    const result = BulkCreateTransactionSchema.safeParse({
      ...validPayload,
      items: [{ categoryId: 'cat1', amount: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects an item missing categoryId', () => {
    const result = BulkCreateTransactionSchema.safeParse({
      ...validPayload,
      items: [{ amount: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing merchant', () => {
    const { merchant, ...rest } = validPayload;
    const result = BulkCreateTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an empty merchant string', () => {
    const result = BulkCreateTransactionSchema.safeParse({ ...validPayload, merchant: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing date', () => {
    const { date, ...rest } = validPayload;
    const result = BulkCreateTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects a missing paymentSourceId', () => {
    const { paymentSourceId, ...rest } = validPayload;
    const result = BulkCreateTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects a missing paymentMethod', () => {
    const { paymentMethod, ...rest } = validPayload;
    const result = BulkCreateTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects an invalid paymentMethod value', () => {
    const result = BulkCreateTransactionSchema.safeParse({ ...validPayload, paymentMethod: 'BITCOIN' });
    expect(result.success).toBe(false);
  });

  it('rejects a type outside EXPENSE/INVESTMENT/SINKING_DEPOSIT', () => {
    const result = BulkCreateTransactionSchema.safeParse({ ...validPayload, type: 'INCOME' });
    expect(result.success).toBe(false);
  });

  it('accepts optional shared notes and tags', () => {
    const result = BulkCreateTransactionSchema.safeParse({
      ...validPayload,
      notes: 'Weekly grocery run',
      tags: ['diwali'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts an optional per-item note', () => {
    const result = BulkCreateTransactionSchema.safeParse({
      ...validPayload,
      items: [{ categoryId: 'cat1', amount: 805, note: 'chicken' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('BulkCreateTransactionSchema — SINKING_DEPOSIT (fund several budgeted bills at once)', () => {
  const sinkingPayload = {
    type: 'SINKING_DEPOSIT' as const,
    date: '2026-08-10',
    budgetPeriodYear: 2026,
    budgetPeriodMonth: 8,
    paymentSourceId: 'acc1',
    toAccountId: 'acc2',
    paymentMethod: 'UPI' as const,
    items: [
      { categoryId: 'cat-electricity', amount: 5000 },
      { categoryId: 'cat-internet', amount: 1000 },
    ],
  };

  it('accepts a valid bulk sinking payload with no merchant', () => {
    const result = BulkCreateTransactionSchema.safeParse(sinkingPayload);
    expect(result.success).toBe(true);
  });

  it('rejects a bulk sinking payload with no destination account', () => {
    const { toAccountId, ...rest } = sinkingPayload;
    const result = BulkCreateTransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('accepts a bulk INVESTMENT payload without requiring toAccountId', () => {
    const { toAccountId, ...rest } = sinkingPayload;
    const result = BulkCreateTransactionSchema.safeParse({ ...rest, type: 'INVESTMENT' });
    expect(result.success).toBe(true);
  });

  it('accepts an optional fundId for goal-progress tracking', () => {
    const result = BulkCreateTransactionSchema.safeParse({ ...sinkingPayload, fundId: 'fund1' });
    expect(result.success).toBe(true);
  });
});

describe('CreateTransactionSchema — SINKING_DEPOSIT destination', () => {
  const base = {
    date: '2026-07-19',
    budgetPeriodYear: 2026,
    budgetPeriodMonth: 7,
    amount: 1000,
    paymentSourceId: 'acc1',
    paymentMethod: 'UPI' as const,
    isPlanned: true,
    isRecurring: false,
  };

  it('requires toAccountId — a sinking deposit always lands in a real account, same as Transfer', () => {
    const result = CreateTransactionSchema.safeParse({ ...base, type: 'SINKING_DEPOSIT' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === 'toAccountId')).toBe(true);
    }
  });

  it('accepts a SINKING_DEPOSIT with toAccountId and no fundId — the fund link is optional enrichment', () => {
    const result = CreateTransactionSchema.safeParse({
      ...base,
      type: 'SINKING_DEPOSIT',
      toAccountId: 'goalwallet1',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a SINKING_DEPOSIT with both toAccountId and fundId', () => {
    const result = CreateTransactionSchema.safeParse({
      ...base,
      type: 'SINKING_DEPOSIT',
      toAccountId: 'goalwallet1',
      fundId: 'fund1',
    });
    expect(result.success).toBe(true);
  });
});
