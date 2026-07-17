import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionRepository } from './transactions.repository';
import { getPeriodTotals, INFLOW_TYPES, OUTFLOW_TYPES, SPEND_ONLY_TYPES } from './period-spend';

vi.mock('./transactions.repository');

beforeEach(() => vi.clearAllMocks());

function mockByType(rows: { type: string; amount: number }[]) {
  vi.mocked(TransactionRepository.sumByTypeForPeriod).mockResolvedValue(
    rows.map((r) => ({ type: r.type, _sum: { amount: r.amount } })) as never,
  );
}

function mockUncategorized(rows: { type: string; amount: number }[]) {
  vi.mocked(TransactionRepository.sumUncategorizedByTypeForPeriod).mockResolvedValue(
    rows.map((r) => ({ type: r.type, _sum: { amount: r.amount } })) as never,
  );
}

describe('OUTFLOW_TYPES / INFLOW_TYPES / SPEND_ONLY_TYPES', () => {
  it('classifies every debit type as outflow and every credit type as inflow', () => {
    expect(OUTFLOW_TYPES).toEqual(
      expect.arrayContaining(['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT']),
    );
    expect(INFLOW_TYPES).toEqual(
      expect.arrayContaining(['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT', 'REFUND']),
    );
  });

  it('excludes neutral types (TRANSFER, ATM_WITHDRAWAL) from both', () => {
    expect(OUTFLOW_TYPES).not.toContain('TRANSFER');
    expect(OUTFLOW_TYPES).not.toContain('ATM_WITHDRAWAL');
    expect(INFLOW_TYPES).not.toContain('TRANSFER');
    expect(INFLOW_TYPES).not.toContain('ATM_WITHDRAWAL');
  });

  it('SPEND_ONLY_TYPES is EXPENSE only, deliberately narrower than OUTFLOW_TYPES', () => {
    expect(SPEND_ONLY_TYPES).toEqual(['EXPENSE']);
    expect(OUTFLOW_TYPES.length).toBeGreaterThan(SPEND_ONLY_TYPES.length);
  });
});

describe('getPeriodTotals', () => {
  it('sums outflow types into totalExpense and credit types into totalIncome', async () => {
    mockByType([
      { type: 'EXPENSE', amount: 20000 },
      { type: 'INVESTMENT', amount: 4000 },
      { type: 'SINKING_DEPOSIT', amount: 399.68 },
      { type: 'INCOME', amount: 85000 },
      { type: 'TRANSFER', amount: 35000 }, // neutral — must not appear in either total
      { type: 'ATM_WITHDRAWAL', amount: 1000 }, // neutral — must not appear in either total
    ]);
    mockUncategorized([]);

    const result = await getPeriodTotals('u1', 2026, 7);

    expect(result.totalExpense).toBeCloseTo(24399.68);
    expect(result.totalIncome).toBe(85000);
    expect(result.net).toBeCloseTo(85000 - 24399.68);
  });

  it('totalExpenseOnly counts EXPENSE alone, excluding INVESTMENT and SINKING_DEPOSIT', async () => {
    mockByType([
      { type: 'EXPENSE', amount: 20000 },
      { type: 'INVESTMENT', amount: 4000 },
      { type: 'SINKING_DEPOSIT', amount: 399.68 },
    ]);
    mockUncategorized([]);

    const result = await getPeriodTotals('u1', 2026, 7);

    expect(result.totalExpenseOnly).toBe(20000);
    expect(result.totalExpense).toBeCloseTo(24399.68);
  });

  it('passes through uncategorizedByType from the repository unchanged', async () => {
    mockByType([{ type: 'EXPENSE', amount: 24399.68 }]);
    mockUncategorized([{ type: 'EXPENSE', amount: 1741 }]);

    const result = await getPeriodTotals('u1', 2026, 7);

    expect(result.uncategorizedByType.EXPENSE).toBe(1741);
  });

  it('returns zero totals when there are no transactions in the period', async () => {
    mockByType([]);
    mockUncategorized([]);

    const result = await getPeriodTotals('u1', 2026, 8);

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.totalExpenseOnly).toBe(0);
    expect(result.net).toBe(0);
  });

  it('relies on the repository to have already excluded VOID transactions', async () => {
    // sumByTypeForPeriod and sumUncategorizedByTypeForPeriod both filter status != VOID
    // at the query level — this module never sees voided rows to begin with, so there is
    // nothing for it to filter. Asserting the repository methods are the ones called
    // (not a raw prisma call) is the guard that keeps that filter from being bypassed.
    mockByType([{ type: 'EXPENSE', amount: 500 }]);
    mockUncategorized([]);

    await getPeriodTotals('u1', 2026, 7);

    expect(TransactionRepository.sumByTypeForPeriod).toHaveBeenCalledWith('u1', 2026, 7);
    expect(TransactionRepository.sumUncategorizedByTypeForPeriod).toHaveBeenCalledWith(
      'u1',
      2026,
      7,
    );
  });
});
