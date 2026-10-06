import { afterEach, describe, expect, it } from 'vitest';
import type { DuePaymentItem } from './derivePayments';
import {
  buildBillTransaction,
  defaultPayAmount,
  readLastSources,
  rememberSource,
  todayISO,
  txTypeForGroup,
} from './bulkPay';

function makeItem(overrides: Partial<DuePaymentItem> = {}): DuePaymentItem {
  return {
    id: 'cat1',
    name: 'Internet',
    amount: 1000,
    dueDay: 10,
    paid: false,
    isSettled: false,
    settledTransactionId: null,
    partial: false,
    remaining: 1000,
    color: null,
    icon: null,
    groupType: 'EXPENSE',
    ...overrides,
  };
}

const hdfc = {
  id: 'acc1',
  name: 'HDFC Savings',
  type: 'BANK_SAVINGS',
  balance: 0,
};
const icici = {
  id: 'acc2',
  name: 'ICICI Card',
  type: 'CREDIT_CARD',
  balance: 0,
};

describe('txTypeForGroup', () => {
  it('logs expense-group bills as EXPENSE', () => {
    expect(txTypeForGroup('EXPENSE')).toBe('EXPENSE');
  });

  it('logs investment-group bills (fund contributions, SIPs) as INVESTMENT', () => {
    expect(txTypeForGroup('INVESTMENT')).toBe('INVESTMENT');
  });

  it('treats income and transfer groups as not payable', () => {
    expect(txTypeForGroup('INCOME')).toBeNull();
    expect(txTypeForGroup('TRANSFER')).toBeNull();
  });
});

describe('defaultPayAmount', () => {
  it('uses the full planned amount when nothing has been paid yet', () => {
    expect(defaultPayAmount(makeItem())).toBe(1000);
  });

  it('uses only what is left on a partially-paid bill', () => {
    expect(defaultPayAmount(makeItem({ partial: true, remaining: 250 }))).toBe(250);
  });
});

describe('buildBillTransaction', () => {
  it('builds a planned EXPENSE against the bill category for the budget month', () => {
    const body = buildBillTransaction({
      item: makeItem(),
      source: icici,
      amount: 1040,
      year: 2026,
      month: 10,
      date: '2026-10-06',
    });
    expect(body).toEqual({
      type: 'EXPENSE',
      date: '2026-10-06',
      budgetPeriodYear: 2026,
      budgetPeriodMonth: 10,
      amount: 1040,
      merchant: 'Internet',
      categoryId: 'cat1',
      paymentSourceId: 'acc2',
      paymentMethod: 'CREDIT_CARD',
      isPlanned: true,
      isRecurring: false,
    });
  });

  it('builds an INVESTMENT for an investment-group bill', () => {
    const body = buildBillTransaction({
      item: makeItem({ name: 'HDFC Mid Cap', groupType: 'INVESTMENT' }),
      source: hdfc,
      amount: 5000,
      year: 2026,
      month: 10,
      date: '2026-10-06',
    });
    expect(body.type).toBe('INVESTMENT');
    expect(body.categoryId).toBe('cat1');
    expect(body.paymentMethod).toBe('UPI');
  });
});

describe('todayISO', () => {
  it('formats the local date as yyyy-MM-dd', () => {
    expect(todayISO(new Date(2026, 9, 6, 23, 30))).toBe('2026-10-06');
  });
});

describe('last-used source memory', () => {
  afterEach(() => localStorage.clear());

  it('returns an empty map when nothing has been remembered', () => {
    expect(readLastSources()).toEqual({});
  });

  it('remembers the account each bill was last paid from', () => {
    rememberSource('cat1', 'acc2');
    rememberSource('cat2', 'acc1');
    rememberSource('cat1', 'acc1');
    expect(readLastSources()).toEqual({ cat1: 'acc1', cat2: 'acc1' });
  });

  it('survives corrupt stored data', () => {
    localStorage.setItem('psp-last-source', '{not json');
    expect(readLastSources()).toEqual({});
  });
});
