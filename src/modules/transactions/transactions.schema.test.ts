import { describe, expect, it } from 'vitest';
import { BulkCreateTransactionSchema } from './transactions.schema';

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

  it('rejects a type other than EXPENSE', () => {
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
