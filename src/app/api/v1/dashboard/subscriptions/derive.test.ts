import { describe, expect, it } from 'vitest';
import { deriveSubscriptionData } from './derive';
import type { RecurringTxInput, SubscriptionTemplateInput } from './derive';

function template(overrides: Partial<SubscriptionTemplateInput> = {}): SubscriptionTemplateInput {
  return {
    id: 't1',
    name: 'Netflix',
    frequency: 'MONTHLY',
    estimatedAmount: 500,
    nextRenewal: '2026-08-05',
    categoryName: 'Entertainment',
    accountName: 'HDFC Card',
    ...overrides,
  };
}

function tx(overrides: Partial<RecurringTxInput> = {}): RecurringTxInput {
  return { recurringTemplateId: 't1', amount: 500, date: new Date('2026-07-05'), ...overrides };
}

function base(overrides: Partial<Parameters<typeof deriveSubscriptionData>[0]> = {}) {
  return deriveSubscriptionData({
    templates: [],
    transactions: [],
    monthlyExpenseTotal: 0,
    ...overrides,
  });
}

describe('deriveSubscriptionData', () => {
  it('returns all-zero/empty data when there are no templates', () => {
    const result = base();
    expect(result.monthlyTotal).toBe(0);
    expect(result.deltaPct).toBe(0);
    expect(result.annualizedTotal).toBe(0);
    expect(result.percentOfSpend).toBeNull();
    expect(result.subscriptions).toEqual([]);
    expect(result.priceIncreases).toEqual([]);
    expect(result.byCategory).toEqual([]);
    expect(result.byAccount).toEqual([]);
  });

  describe('monthly normalization', () => {
    it('uses estimatedAmount when a template has no transaction history yet', () => {
      const result = base({ templates: [template({ estimatedAmount: 750 })] });
      expect(result.monthlyTotal).toBe(750);
      expect(result.subscriptions[0].amount).toBe(750);
    });

    it('normalizes ANNUAL frequency to 1/12th per month', () => {
      const result = base({ templates: [template({ frequency: 'ANNUAL', estimatedAmount: 1200 })] });
      expect(result.monthlyTotal).toBe(100);
    });

    it('normalizes QUARTERLY frequency to 1/3rd per month', () => {
      const result = base({ templates: [template({ frequency: 'QUARTERLY', estimatedAmount: 900 })] });
      expect(result.monthlyTotal).toBe(300);
    });

    it('normalizes TWICE_MONTHLY frequency to 2x per month', () => {
      const result = base({ templates: [template({ frequency: 'TWICE_MONTHLY', estimatedAmount: 200 })] });
      expect(result.monthlyTotal).toBe(400);
    });
  });

  describe('price increases', () => {
    it('is not flagged when there is only one charge on record', () => {
      const result = base({
        templates: [template()],
        transactions: [tx({ amount: 500, date: new Date('2026-07-05') })],
      });
      expect(result.priceIncreases).toEqual([]);
      expect(result.subscriptions[0].previousAmount).toBeNull();
    });

    it('flags a template whose latest charge is higher than the one before it', () => {
      const result = base({
        templates: [template()],
        transactions: [
          tx({ amount: 500, date: new Date('2026-06-05') }),
          tx({ amount: 650, date: new Date('2026-07-05') }),
        ],
      });
      expect(result.priceIncreases).toHaveLength(1);
      const inc = result.priceIncreases[0];
      expect(inc.oldAmount).toBe(500);
      expect(inc.newAmount).toBe(650);
      expect(inc.deltaAmount).toBe(150);
      expect(inc.deltaPct).toBe(30);
      expect(inc.changedDate).toBe('2026-07-05');
      expect(result.subscriptions[0].previousAmount).toBe(500);
    });

    it('does not flag a template whose latest charge is lower than the one before it', () => {
      const result = base({
        templates: [template()],
        transactions: [
          tx({ amount: 650, date: new Date('2026-06-05') }),
          tx({ amount: 500, date: new Date('2026-07-05') }),
        ],
      });
      expect(result.priceIncreases).toEqual([]);
      expect(result.subscriptions[0].previousAmount).toBeNull();
    });

    it('sorts multiple price increases by deltaPct descending', () => {
      const result = base({
        templates: [template({ id: 'a', name: 'A' }), template({ id: 'b', name: 'B' })],
        transactions: [
          tx({ recurringTemplateId: 'a', amount: 100, date: new Date('2026-06-01') }),
          tx({ recurringTemplateId: 'a', amount: 110, date: new Date('2026-07-01') }), // +10%
          tx({ recurringTemplateId: 'b', amount: 100, date: new Date('2026-06-01') }),
          tx({ recurringTemplateId: 'b', amount: 150, date: new Date('2026-07-01') }), // +50%
        ],
      });
      expect(result.priceIncreases.map((p) => p.id)).toEqual(['b', 'a']);
    });
  });

  describe('deltaPct (overall cost trend)', () => {
    it('is 0 when nothing has a known previous amount', () => {
      const result = base({ templates: [template()] });
      expect(result.deltaPct).toBe(0);
    });

    it('reflects the aggregate swing across all templates', () => {
      const result = base({
        templates: [template()],
        transactions: [
          tx({ amount: 500, date: new Date('2026-06-05') }),
          tx({ amount: 600, date: new Date('2026-07-05') }),
        ],
      });
      expect(result.deltaPct).toBe(20);
    });
  });

  describe('breakdowns', () => {
    it('groups by category and account, sorted by amount descending', () => {
      const result = base({
        templates: [
          template({ id: 'a', name: 'Netflix', estimatedAmount: 500, categoryName: 'Entertainment', accountName: 'HDFC Card' }),
          template({ id: 'b', name: 'Gym', estimatedAmount: 1500, categoryName: 'Health', accountName: 'HDFC Card' }),
        ],
      });
      expect(result.byCategory).toEqual([
        { label: 'Health', amount: 1500 },
        { label: 'Entertainment', amount: 500 },
      ]);
      expect(result.byAccount).toEqual([{ label: 'HDFC Card', amount: 2000 }]);
    });

    it('falls back to Uncategorized/Unassigned when a template has no category/account', () => {
      const result = base({
        templates: [template({ categoryName: null, accountName: null })],
      });
      expect(result.byCategory).toEqual([{ label: 'Uncategorized', amount: 500 }]);
      expect(result.byAccount).toEqual([{ label: 'Unassigned', amount: 500 }]);
    });
  });

  describe('percentOfSpend', () => {
    it('is null when monthlyExpenseTotal is 0', () => {
      const result = base({ templates: [template()], monthlyExpenseTotal: 0 });
      expect(result.percentOfSpend).toBeNull();
    });

    it('computes the rounded percentage otherwise', () => {
      const result = base({ templates: [template({ estimatedAmount: 500 })], monthlyExpenseTotal: 2000 });
      expect(result.percentOfSpend).toBe(25);
    });
  });

  describe('subscriptions list', () => {
    it('sorts by next renewal date ascending', () => {
      const result = base({
        templates: [
          template({ id: 'a', name: 'Later', nextRenewal: '2026-08-20' }),
          template({ id: 'b', name: 'Sooner', nextRenewal: '2026-08-02' }),
        ],
      });
      expect(result.subscriptions.map((s) => s.name)).toEqual(['Sooner', 'Later']);
    });
  });
});
