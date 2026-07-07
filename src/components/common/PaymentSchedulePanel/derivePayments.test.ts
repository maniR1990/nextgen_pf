import type { BudgetCategoryNode, BudgetGroup } from '@/modules/budget-engine/budget-engine.types';
import { describe, expect, it } from 'vitest';
import { derivePayments, getStatus, ordinal, worstStatus } from './derivePayments';

function makeNode(overrides: Partial<BudgetCategoryNode> & { id: string }): BudgetCategoryNode {
  return {
    name: overrides.id,
    level: 1,
    icon: null,
    color: null,
    isSystem: false,
    isRecurring: false,
    isUnplanned: false,
    dueDay: null,
    isSettled: false,
    settledTransactionId: null,
    planned: 0,
    actual: 0,
    lastMonthActual: 0,
    variance: 0,
    variancePct: 0,
    progressPct: 0,
    children: [],
    ...overrides,
  };
}

function makeGroup(categories: BudgetCategoryNode[]): BudgetGroup {
  return {
    id: 'group1',
    name: 'Expenses',
    type: 'EXPENSE',
    planned: 0,
    actual: 0,
    lastMonthActual: 0,
    variance: 0,
    variancePct: 0,
    progressPct: 0,
    categories,
  };
}

describe('derivePayments', () => {
  it('ignores categories with no dueDay set', () => {
    const items = derivePayments([makeGroup([makeNode({ id: 'no-due' })])]);
    expect(items).toHaveLength(0);
  });

  it('collects a category with a dueDay, at any depth', () => {
    const child = makeNode({ id: 'child', dueDay: 10, planned: 500 });
    const parent = makeNode({ id: 'parent', children: [child] });
    const items = derivePayments([makeGroup([parent])]);
    expect(items.map((i) => i.id)).toEqual(['child']);
  });

  it('marks paid via the actual>=planned heuristic when not explicitly settled', () => {
    const items = derivePayments([
      makeGroup([makeNode({ id: 'rent', dueDay: 5, planned: 20000, actual: 20000 })]),
    ]);
    expect(items[0]!.paid).toBe(true);
  });

  it('does not mark paid when actual is below planned and never settled', () => {
    const items = derivePayments([
      makeGroup([makeNode({ id: 'rent', dueDay: 5, planned: 20000, actual: 5000 })]),
    ]);
    expect(items[0]!.paid).toBe(false);
  });

  it('an explicit settlement marks paid even with zero actual spend — the annual-premium case', () => {
    const items = derivePayments([
      makeGroup([
        makeNode({
          id: 'insurance',
          dueDay: 6,
          planned: 6000,
          actual: 0, // the settling transaction was a TRANSFER, never rolled into `actual`
          isSettled: true,
          settledTransactionId: 'tx1',
        }),
      ]),
    ]);
    expect(items[0]!.paid).toBe(true);
    expect(items[0]!.isSettled).toBe(true);
    expect(items[0]!.settledTransactionId).toBe('tx1');
  });

  it('planned=0 with no actual and not settled is not paid (avoids a false-positive on empty items)', () => {
    const items = derivePayments([
      makeGroup([makeNode({ id: 'unset', dueDay: 15, planned: 0, actual: 0 })]),
    ]);
    expect(items[0]!.paid).toBe(false);
  });

  it('sorts by dueDay ascending, paid items last within the same day', () => {
    const items = derivePayments([
      makeGroup([
        makeNode({ id: 'b-paid', dueDay: 10, planned: 100, actual: 100 }),
        makeNode({ id: 'a-unpaid', dueDay: 10, planned: 100, actual: 0 }),
        makeNode({ id: 'earliest', dueDay: 3, planned: 100, actual: 0 }),
      ]),
    ]);
    expect(items.map((i) => i.id)).toEqual(['earliest', 'a-unpaid', 'b-paid']);
  });
});

describe('getStatus', () => {
  const base = { id: 'x', name: 'x', amount: 100, dueDay: 10, color: null, icon: null };

  it('is "paid" whenever the item is paid, regardless of date', () => {
    expect(getStatus({ ...base, paid: true, isSettled: true, settledTransactionId: 'tx' }, 20, false)).toBe(
      'paid',
    );
  });

  it('is "upcoming" for any unpaid item in a future month', () => {
    expect(
      getStatus({ ...base, dueDay: 1, paid: false, isSettled: false, settledTransactionId: null }, 20, true),
    ).toBe('upcoming');
  });

  it('is "overdue" once today has passed the due day, unpaid', () => {
    expect(
      getStatus({ ...base, dueDay: 5, paid: false, isSettled: false, settledTransactionId: null }, 7, false),
    ).toBe('overdue');
  });

  it('is "soon" within 3 days of the due day, unpaid', () => {
    expect(
      getStatus({ ...base, dueDay: 10, paid: false, isSettled: false, settledTransactionId: null }, 8, false),
    ).toBe('soon');
  });

  it('is "upcoming" when the due day is more than 3 days out, unpaid', () => {
    expect(
      getStatus({ ...base, dueDay: 20, paid: false, isSettled: false, settledTransactionId: null }, 1, false),
    ).toBe('upcoming');
  });
});

describe('worstStatus', () => {
  it('overdue beats every other status', () => {
    expect(worstStatus(['paid', 'upcoming', 'overdue', 'soon'])).toBe('overdue');
  });

  it('all-paid stays paid', () => {
    expect(worstStatus(['paid', 'paid'])).toBe('paid');
  });

  it('defaults to paid for an empty list (vacuous — no items, nothing outstanding)', () => {
    expect(worstStatus([])).toBe('paid');
  });
});

describe('ordinal', () => {
  it.each([
    [1, 'st'],
    [2, 'nd'],
    [3, 'rd'],
    [4, 'th'],
    [11, 'th'],
    [12, 'th'],
    [13, 'th'],
    [21, 'st'],
    [22, 'nd'],
    [23, 'rd'],
  ])('ordinal(%i) -> %s', (n, suffix) => {
    expect(ordinal(n)).toBe(suffix);
  });
});
