import { BudgetEngineService } from '@/modules/budget-engine';
import { getPeriodTotals } from '@/modules/transactions/period-spend';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsService } from './reports.service';

vi.mock('@/modules/budget-engine');
vi.mock('@/modules/transactions/transactions.repository');
vi.mock('@/modules/transactions/period-spend');

function node(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'cat1',
    name: 'Groceries',
    level: 1,
    icon: null,
    color: null,
    isSystem: false,
    isVirtual: false,
    isRecurring: false,
    frequency: null,
    months: [],
    isUnplanned: false,
    dueDay: null,
    transferred: null,
    fundTargetAmount: null,
    isSettled: false,
    settledTransactionId: null,
    planned: 5000,
    actual: 4200,
    lastMonthActual: 0,
    variance: 0,
    variancePct: 0,
    progressPct: 0,
    children: [],
    ...overrides,
  };
}

const SUMMARY = {
  year: 2026,
  month: 7,
  groups: [
    {
      id: 'g-expense',
      name: 'Expenses',
      type: 'EXPENSE',
      planned: 9500,
      actual: 8300,
      lastMonthActual: 0,
      variance: 0,
      variancePct: 0,
      progressPct: 0,
      categories: [node({ id: 'cat1', planned: 5000 }), node({ id: 'cat2', name: 'Utilities', planned: 4500 })],
    },
    {
      id: 'g-income',
      name: 'Income',
      type: 'INCOME',
      planned: 85000,
      actual: 85000,
      lastMonthActual: 0,
      variance: 0,
      variancePct: 0,
      progressPct: 0,
      categories: [node({ id: 'cat3', name: 'Salary', planned: 85000 })],
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(TransactionRepository.sumFiltered).mockResolvedValue({
    actual: 4200,
    count: 6,
    recurringActual: 1500,
  });
  vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(SUMMARY as never);
  vi.mocked(getPeriodTotals).mockResolvedValue({ totalIncome: 85000 } as never);
});

describe('ReportsService.getFilteredReport', () => {
  it('looks up the matching category node for planned when categoryId + month are set', async () => {
    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      categoryId: 'cat1',
    });

    expect(result.planned).toBe(5000);
    expect(result.actual).toBe(4200);
    expect(result.variance).toBe(-800);
    expect(result.pctOfPlanned).toBe(84);
  });

  it('finds a category nested under children, not just top-level', async () => {
    const nested = {
      ...SUMMARY,
      groups: [
        {
          ...SUMMARY.groups[0],
          categories: [node({ id: 'parent', planned: 1000, children: [node({ id: 'child', planned: 300 })] })],
        },
      ],
    };
    vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(nested as never);

    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      categoryId: 'child',
    });

    expect(result.planned).toBe(300);
  });

  it('sums matching groups when only type is set (no category)', async () => {
    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      type: 'EXPENSE',
    });

    expect(result.planned).toBe(9500);
  });

  it('sums every group when neither category nor type is set', async () => {
    const result = await ReportsService.getFilteredReport('u1', { year: 2026, month: 7 });

    expect(result.planned).toBe(9500 + 85000);
  });

  it('suppresses planned/variance when an account filter is set, since budgets have no account dimension', async () => {
    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      accountId: 'acc1',
    });

    expect(result.planned).toBeNull();
    expect(result.variance).toBeNull();
    expect(result.pctOfPlanned).toBeNull();
    expect(BudgetEngineService.getMonthlySummary).not.toHaveBeenCalled();
  });

  it('suppresses planned/variance for an all-time query (no month selected)', async () => {
    const result = await ReportsService.getFilteredReport('u1', {});

    expect(result.planned).toBeNull();
    expect(BudgetEngineService.getMonthlySummary).not.toHaveBeenCalled();
  });

  it('defaults planned to 0 when the categoryId is not found in the tree', async () => {
    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      categoryId: 'does-not-exist',
    });

    expect(result.planned).toBe(0);
    expect(result.pctOfPlanned).toBeNull();
  });

  it('passes actual/count/recurring straight through from the repository', async () => {
    vi.mocked(TransactionRepository.sumFiltered).mockResolvedValue({
      actual: 0,
      count: 0,
      recurringActual: 0,
    });

    const result = await ReportsService.getFilteredReport('u1', { year: 2026, month: 7 });

    expect(result.actual).toBe(0);
    expect(result.count).toBe(0);
    expect(result.recurringActual).toBe(0);
  });

  it('compares actual against the same filters for the prior calendar month', async () => {
    vi.mocked(TransactionRepository.sumFiltered).mockImplementation(async (_userId, filters) => {
      if (filters.month === 6) return { actual: 3500, count: 4, recurringActual: 0 };
      return { actual: 4200, count: 6, recurringActual: 1500 };
    });

    const result = await ReportsService.getFilteredReport('u1', { year: 2026, month: 7 });

    expect(result.previousActual).toBe(3500);
    // (4200 - 3500) / 3500 * 100 = 20%
    expect(result.previousChangePct).toBe(20);
  });

  it('rolls a January query back to December of the prior year for the trend comparison', async () => {
    vi.mocked(TransactionRepository.sumFiltered).mockImplementation(async (_userId, filters) => {
      if (filters.year === 2025 && filters.month === 12) {
        return { actual: 1000, count: 1, recurringActual: 0 };
      }
      return { actual: 4200, count: 6, recurringActual: 1500 };
    });

    const result = await ReportsService.getFilteredReport('u1', { year: 2026, month: 1 });

    expect(result.previousActual).toBe(1000);
  });

  it('has no previous-period baseline the first time a filter combo is ever used', async () => {
    vi.mocked(TransactionRepository.sumFiltered).mockImplementation(async (_userId, filters) => {
      if (filters.month === 6) return { actual: 0, count: 0, recurringActual: 0 };
      return { actual: 4200, count: 6, recurringActual: 1500 };
    });

    const result = await ReportsService.getFilteredReport('u1', { year: 2026, month: 7 });

    expect(result.previousActual).toBe(0);
    expect(result.previousChangePct).toBeNull();
  });

  it("computes pctOfIncome from that month's total income", async () => {
    vi.mocked(getPeriodTotals).mockResolvedValue({ totalIncome: 20000 } as never);

    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      type: 'EXPENSE',
    });

    // 4200 / 20000 * 100 = 21%
    expect(result.pctOfIncome).toBe(21);
    expect(result.incomeForPeriod).toBe(20000);
  });

  it('leaves previousActual and pctOfIncome null for an all-time query', async () => {
    const result = await ReportsService.getFilteredReport('u1', {});

    expect(result.previousActual).toBeNull();
    expect(result.previousChangePct).toBeNull();
    expect(result.pctOfIncome).toBeNull();
    expect(result.incomeForPeriod).toBeNull();
    expect(getPeriodTotals).not.toHaveBeenCalled();
  });
});
