import { describe, expect, it } from 'vitest';
import { deriveCalendarData } from './derive';

function base(overrides: Partial<Parameters<typeof deriveCalendarData>[0]> = {}) {
  return deriveCalendarData({
    dayOfMonth: 18,
    totalDays: 31,
    expenseDays: [],
    incomeDays: [],
    duePayments: [],
    plannedTotal: 0,
    actualTotal: 0,
    ...overrides,
  });
}

describe('deriveCalendarData', () => {
  describe('noSpendDays', () => {
    it('includes every elapsed day that had no expense', () => {
      const result = base({ dayOfMonth: 5, expenseDays: [2, 4] });
      expect(result.noSpendDays).toEqual([1, 3, 5]);
    });

    it('never includes a day past dayOfMonth, even if it later has no expense', () => {
      const result = base({ dayOfMonth: 3, expenseDays: [] });
      expect(result.noSpendDays).toEqual([1, 2, 3]);
    });

    it('is empty when dayOfMonth is 0 (a future month)', () => {
      const result = base({ dayOfMonth: 0, expenseDays: [] });
      expect(result.noSpendDays).toEqual([]);
    });
  });

  describe('bestStreak', () => {
    it('is 1 when no-spend days are scattered with no two adjacent', () => {
      const result = base({ dayOfMonth: 18, expenseDays: [1, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 17, 18] });
      // no-spend days: 2, 5, 9, 13, 16 — none consecutive.
      expect(result.noSpendDays).toEqual([2, 5, 9, 13, 16]);
      expect(result.bestStreak).toBe(1);
    });

    it('finds the longest consecutive run, not just the first one', () => {
      // Expense on 1, 5, 8 -> no-spend runs: [2,3,4] (3), [6,7] (2), [9,10] (2, elapsed to 10).
      const result = base({ dayOfMonth: 10, expenseDays: [1, 5, 8] });
      expect(result.bestStreak).toBe(3);
    });

    it('is 0 when every elapsed day had an expense', () => {
      const result = base({ dayOfMonth: 3, expenseDays: [1, 2, 3] });
      expect(result.bestStreak).toBe(0);
    });
  });

  describe('incomeDays', () => {
    it('passes through sorted, regardless of input order', () => {
      const result = base({ incomeDays: [15, 1, 8] });
      expect(result.incomeDays).toEqual([1, 8, 15]);
    });
  });

  describe('billDue', () => {
    it('maps dueDay/name/amount/paid and sorts by day', () => {
      const result = base({
        duePayments: [
          { dueDay: 25, name: 'Credit card', amount: 3200, paid: false },
          { dueDay: 5, name: 'Rent', amount: 15000, paid: true },
        ],
      });
      expect(result.billDue).toEqual([
        { day: 5, name: 'Rent', amount: 15000, paid: true },
        { day: 25, name: 'Credit card', amount: 3200, paid: false },
      ]);
    });
  });

  describe('budgetPace', () => {
    it('computes spendPct and timePct', () => {
      const result = base({ dayOfMonth: 18, totalDays: 31, plannedTotal: 40000, actualTotal: 24800 });
      expect(result.budgetPace.spendPct).toBe(62);
      expect(result.budgetPace.timePct).toBe(58);
    });

    it('does not divide by zero when nothing is planned', () => {
      const result = base({ plannedTotal: 0, actualTotal: 500 });
      expect(result.budgetPace.spendPct).toBe(0);
    });

    it('does not divide by zero when totalDays is 0', () => {
      const result = base({ totalDays: 0, dayOfMonth: 0 });
      expect(result.budgetPace.timePct).toBe(0);
    });
  });
});
