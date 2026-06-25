import { describe, expect, it } from 'vitest';
import { CreateFundSchema, UpdateFundSchema } from './funds.schema';

describe('CreateFundSchema', () => {
  it('accepts name + purpose + targetAmount with no categoryId', () => {
    const result = CreateFundSchema.safeParse({
      name: 'Emergency Fund',
      purpose: 'EMERGENCY',
      targetAmount: 100000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('categoryId' in result.data).toBe(false);
    }
  });

  it('accepts name + purpose + targetMonths (no targetAmount)', () => {
    const result = CreateFundSchema.safeParse({
      name: 'Monthly Buffer',
      purpose: 'OPS',
      targetMonths: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects when neither targetAmount nor targetMonths provided', () => {
    const result = CreateFundSchema.safeParse({
      name: 'Empty Fund',
      purpose: 'GOAL',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown purpose values', () => {
    const result = CreateFundSchema.safeParse({
      name: 'Misc',
      purpose: 'UNKNOWN_GROUP',
      targetAmount: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = CreateFundSchema.safeParse({
      name: '',
      purpose: 'EMERGENCY',
      targetAmount: 100000,
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 8 fund purposes', () => {
    const purposes = [
      'EMERGENCY',
      'OPS',
      'GOAL',
      'TAX',
      'INSURANCE',
      'SINKING',
      'INVESTMENT',
      'WEALTH',
    ] as const;
    for (const purpose of purposes) {
      const result = CreateFundSchema.safeParse({ name: purpose, purpose, targetAmount: 1000 });
      expect(result.success, `purpose ${purpose} should be valid`).toBe(true);
    }
  });
});

describe('UpdateFundSchema', () => {
  it('accepts partial update with no categoryId', () => {
    const result = UpdateFundSchema.safeParse({ name: 'Renamed Fund' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect('categoryId' in result.data).toBe(false);
    }
  });

  it('accepts empty object (all fields optional)', () => {
    expect(UpdateFundSchema.safeParse({}).success).toBe(true);
  });
});
