import { BudgetEngineService } from '@/modules/budget-engine';
import { CategoriesRepository } from '@/modules/categories/categories.repository';
import { getPeriodTotals } from '@/modules/transactions/period-spend';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportsService } from './reports.service';

vi.mock('@/modules/budget-engine');
vi.mock('@/modules/transactions/transactions.repository');
vi.mock('@/modules/transactions/period-spend');
vi.mock('@/modules/categories/categories.repository');

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
  // Empty flat list by default — collectDescendantIds then resolves each selected id to
  // just itself, i.e. an exact match, which is what most tests below actually want.
  vi.mocked(CategoriesRepository.findAccessible).mockResolvedValue([] as never);
});

describe('ReportsService.getFilteredReport', () => {
  it('looks up the matching category node for planned when categoryIds + month are set', async () => {
    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      categoryIds: ['cat1'],
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
      categoryIds: ['child'],
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
      categoryIds: ['does-not-exist'],
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

  it('leaves pctOfIncome and incomeForPeriod null for an all-time query', async () => {
    const result = await ReportsService.getFilteredReport('u1', {});

    expect(result.pctOfIncome).toBeNull();
    expect(result.incomeForPeriod).toBeNull();
    expect(getPeriodTotals).not.toHaveBeenCalled();
  });

  it('expands a selected parent category to include every descendant when computing actual', async () => {
    vi.mocked(CategoriesRepository.findAccessible).mockResolvedValue([
      { id: 'groceries', parentId: null },
      { id: 'supermarket', parentId: 'groceries' },
      { id: 'local-market', parentId: 'groceries' },
      { id: 'unrelated', parentId: null },
    ] as never);

    await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      categoryIds: ['groceries'],
    });

    const call = vi.mocked(TransactionRepository.sumFiltered).mock.calls[0]!;
    expect(call[1].categoryIds).toEqual(
      expect.arrayContaining(['groceries', 'supermarket', 'local-market']),
    );
    expect(call[1].categoryIds).toHaveLength(3);
  });

  it('unions descendant ids across several selected categories, e.g. Groceries + Household', async () => {
    vi.mocked(CategoriesRepository.findAccessible).mockResolvedValue([
      { id: 'groceries', parentId: null },
      { id: 'supermarket', parentId: 'groceries' },
      { id: 'household', parentId: null },
      { id: 'cleaning-supplies', parentId: 'household' },
    ] as never);

    await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      categoryIds: ['groceries', 'household'],
    });

    const call = vi.mocked(TransactionRepository.sumFiltered).mock.calls[0]!;
    expect(call[1].categoryIds).toEqual(
      expect.arrayContaining(['groceries', 'supermarket', 'household', 'cleaning-supplies']),
    );
    expect(call[1].categoryIds).toHaveLength(4);
  });

  it('sums planned across every selected root category', async () => {
    const nested = {
      ...SUMMARY,
      groups: [
        {
          ...SUMMARY.groups[0],
          categories: [
            node({ id: 'groceries', name: 'Groceries', planned: 5000 }),
            node({ id: 'household', name: 'Household', planned: 2000 }),
          ],
        },
      ],
    };
    vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(nested as never);

    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      categoryIds: ['groceries', 'household'],
    });

    expect(result.planned).toBe(7000);
  });

  it('does not double-count planned when both a parent and its own child are selected', async () => {
    // Belt-and-suspenders test for the API being reachable directly, bypassing the
    // picker's own ancestor/descendant exclusion — "groceries" (parent) and
    // "supermarket" (its child) selected together should sum only groceries' already
    // rolled-up planned amount, not both.
    vi.mocked(CategoriesRepository.findAccessible).mockResolvedValue([
      { id: 'groceries', parentId: null },
      { id: 'supermarket', parentId: 'groceries' },
    ] as never);
    const nested = {
      ...SUMMARY,
      groups: [
        {
          ...SUMMARY.groups[0],
          categories: [
            node({
              id: 'groceries',
              name: 'Groceries',
              planned: 5000,
              children: [node({ id: 'supermarket', name: 'Supermarket', planned: 3000 })],
            }),
          ],
        },
      ],
    };
    vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(nested as never);

    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      categoryIds: ['groceries', 'supermarket'],
    });

    // Not 5000 + 3000 = 8000 — "supermarket" is dropped as redundant once "groceries"
    // (its ancestor) is also selected, since groceries' own .planned already includes it.
    expect(result.planned).toBe(5000);
  });

  it('does not resolve descendants at all when no category is selected', async () => {
    await ReportsService.getFilteredReport('u1', { year: 2026, month: 7 });

    expect(CategoriesRepository.findAccessible).not.toHaveBeenCalled();
  });
});
