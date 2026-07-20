import { describe, expect, it } from 'vitest';
import {
  dueAmountFromMonthly,
  FREQUENCY_INTERVAL_MONTHS,
  isDueInMonth,
  monthlyEquivalent,
  monthsFromAnchor,
} from './recurringFrequency';

describe('monthlyEquivalent', () => {
  it('returns the amount unchanged for MONTHLY', () => {
    expect(monthlyEquivalent(500, 'MONTHLY')).toBe(500);
  });

  it('divides an annual amount by 12', () => {
    expect(monthlyEquivalent(1200, 'ANNUAL')).toBe(100);
  });

  it('divides a half-yearly amount by 6', () => {
    expect(monthlyEquivalent(6000, 'HALF_YEARLY')).toBe(1000);
  });

  it('divides a quarterly amount by 3', () => {
    expect(monthlyEquivalent(1200, 'QUARTERLY')).toBeCloseTo(400);
  });

  it('returns the amount unchanged when frequency is null', () => {
    expect(monthlyEquivalent(500, null)).toBe(500);
  });
});

describe('dueAmountFromMonthly', () => {
  it('is the inverse of monthlyEquivalent for every frequency', () => {
    for (const frequency of Object.keys(FREQUENCY_INTERVAL_MONTHS) as Array<
      keyof typeof FREQUENCY_INTERVAL_MONTHS
    >) {
      const monthly = monthlyEquivalent(1200, frequency);
      expect(dueAmountFromMonthly(monthly, frequency)).toBeCloseTo(1200);
    }
  });
});

describe('isDueInMonth', () => {
  it('is always due for MONTHLY regardless of months list', () => {
    expect(isDueInMonth('MONTHLY', [], 5)).toBe(true);
  });

  it('is always due when frequency is null', () => {
    expect(isDueInMonth(null, [], 5)).toBe(true);
  });

  it('is due when the month is in the explicit due-months list', () => {
    expect(isDueInMonth('HALF_YEARLY', [1, 7], 7)).toBe(true);
  });

  it('is not due when the month is absent from the due-months list', () => {
    expect(isDueInMonth('HALF_YEARLY', [1, 7], 3)).toBe(false);
  });

  it('fails safe: a non-monthly frequency with no months set is never due', () => {
    expect(isDueInMonth('QUARTERLY', [], 3)).toBe(false);
  });
});

describe('monthsFromAnchor', () => {
  it('spaces half-yearly evenly from the anchor month', () => {
    expect(monthsFromAnchor('HALF_YEARLY', 3)).toEqual([3, 9]);
  });

  it('wraps around the year boundary', () => {
    expect(monthsFromAnchor('QUARTERLY', 11)).toEqual([2, 5, 8, 11]);
  });

  it('returns a single month for annual', () => {
    expect(monthsFromAnchor('ANNUAL', 7)).toEqual([7]);
  });

  it('returns every-2-months as six evenly spaced months', () => {
    expect(monthsFromAnchor('EVERY_2_MONTHS', 1)).toEqual([1, 3, 5, 7, 9, 11]);
  });

  it('returns an empty list for MONTHLY (no explicit months needed)', () => {
    expect(monthsFromAnchor('MONTHLY', 5)).toEqual([]);
  });

  it('returns an empty list for TWICE_MONTHLY (sub-month interval)', () => {
    expect(monthsFromAnchor('TWICE_MONTHLY', 5)).toEqual([]);
  });
});
