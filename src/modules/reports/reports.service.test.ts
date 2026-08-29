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
    // Mirrors planned/actual by default — true for every leaf, since there's nothing to
    // roll up. Override explicitly for a node meant to have children with its own data.
    ownPlanned: overrides.planned ?? 5000,
    ownActual: overrides.actual ?? 4200,
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
      categories: [
        node({ id: 'cat1', planned: 5000 }),
        node({ id: 'cat2', name: 'Utilities', planned: 4500 }),
      ],
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
  vi.mocked(TransactionRepository.sumUnplannedByCategory).mockResolvedValue([]);
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
          categories: [
            node({ id: 'parent', planned: 1000, children: [node({ id: 'child', planned: 300 })] }),
          ],
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

  it('returns a per-type breakdown instead of one blended total when neither category nor type is set', async () => {
    const result = await ReportsService.getFilteredReport('u1', { year: 2026, month: 7 });

    // Top-level single-number fields are null — Income + Expense + Investment don't sum
    // to anything meaningful, so there's no honest single "planned"/"actual" to report.
    expect(result.planned).toBeNull();
    expect(result.actual).toBeNull();
    expect(result.byType).not.toBeNull();

    const expense = result.byType!.find((b) => b.type === 'EXPENSE');
    const income = result.byType!.find((b) => b.type === 'INCOME');
    expect(expense!.planned).toBe(9500);
    expect(income!.planned).toBe(85000);
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

    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      type: 'EXPENSE',
    });

    expect(result.actual).toBe(0);
    expect(result.count).toBe(0);
    expect(result.recurringActual).toBe(0);
  });

  it('sums per-type counts into the top-level count when neither category nor type is set', async () => {
    vi.mocked(TransactionRepository.sumFiltered).mockResolvedValue({
      actual: 100,
      count: 4,
      recurringActual: 0,
    });

    const result = await ReportsService.getFilteredReport('u1', { year: 2026, month: 7 });

    // INCOME + EXPENSE: 1 query each, 4 matches → 8. INVESTMENT: 2 queries (INVESTMENT +
    // SINKING_DEPOSIT, merged into one card), 4 matches each → 8. Total 16.
    expect(result.count).toBe(16);
  });

  it('splits the INVESTMENT bucket into investmentActual/sinkingActual and merges both into actual', async () => {
    vi.mocked(TransactionRepository.sumFiltered).mockImplementation(async (_userId, filters) => {
      if (filters.type === 'SINKING_DEPOSIT') return { actual: 1000, count: 1, recurringActual: 0 };
      if (filters.type === 'INVESTMENT') return { actual: 3000, count: 2, recurringActual: 0 };
      return { actual: 0, count: 0, recurringActual: 0 };
    });

    const result = await ReportsService.getFilteredReport('u1', { year: 2026, month: 7 });

    const investment = result.byType!.find((b) => b.type === 'INVESTMENT')!;
    expect(investment.investmentActual).toBe(3000);
    expect(investment.sinkingActual).toBe(1000);
    expect(investment.actual).toBe(4000);
    expect(investment.count).toBe(3);
  });

  it('merges Sinking Deposit into actual when INVESTMENT is selected as a single type', async () => {
    vi.mocked(TransactionRepository.sumFiltered).mockImplementation(async (_userId, filters) => {
      if (filters.type === 'SINKING_DEPOSIT') return { actual: 500, count: 1, recurringActual: 0 };
      if (filters.type === 'INVESTMENT') return { actual: 2000, count: 1, recurringActual: 0 };
      return { actual: 0, count: 0, recurringActual: 0 };
    });

    const result = await ReportsService.getFilteredReport('u1', {
      year: 2026,
      month: 7,
      type: 'INVESTMENT',
    });

    expect(result.actual).toBe(2500);
    expect(result.investmentActual).toBe(2000);
    expect(result.sinkingActual).toBe(500);
    expect(result.byType).toBeNull();
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

describe('ReportsService.getBudgetFlags', () => {
  it('lists unplanned spend and over-budget categories from EXPENSE only, sorted by size', async () => {
    const flaggedSummary = {
      year: 2026,
      month: 7,
      groups: [
        {
          id: 'g-expense',
          name: 'Expenses',
          type: 'EXPENSE',
          planned: 0,
          actual: 0,
          lastMonthActual: 0,
          variance: 0,
          variancePct: 0,
          progressPct: 0,
          categories: [
            // Over budget, not unplanned.
            node({ id: 'groceries', name: 'Groceries', planned: 5000, actual: 6200 }),
            // Unplanned, not over budget (no plan at all).
            node({ id: 'gadget', name: 'Gadget', planned: 0, actual: 3000, isUnplanned: true }),
            // Nested: unplanned AND over budget — appears in both lists, with parent context.
            node({
              id: 'personal-care',
              name: 'Personal Care',
              planned: 0,
              actual: 0,
              children: [
                node({
                  id: 'haircut',
                  name: 'Haircut',
                  planned: 500,
                  actual: 1800,
                  isUnplanned: true,
                }),
              ],
            }),
            // Neither — under budget, not flagged.
            node({ id: 'utilities', name: 'Utilities', planned: 4500, actual: 4000 }),
            // The synthetic Uncategorized row — never a real report row.
            node({
              id: 'uncategorized',
              name: 'Uncategorized',
              isVirtual: true,
              planned: 0,
              actual: 900,
            }),
          ],
        },
        {
          id: 'g-income',
          name: 'Income',
          type: 'INCOME',
          planned: 85000,
          actual: 90000,
          lastMonthActual: 0,
          variance: 0,
          variancePct: 0,
          progressPct: 0,
          // Over its own plan and unplanned — must never leak into an EXPENSE-only report.
          categories: [
            node({ id: 'bonus', name: 'Bonus', planned: 80000, actual: 90000, isUnplanned: true }),
          ],
        },
      ],
    };
    vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(flaggedSummary as never);

    const result = await ReportsService.getBudgetFlags('u1', 2026, 7);

    // gadget (₹3,000) sorts before haircut (₹1,800) — highest amount first.
    expect(result.unplanned.map((u) => u.id)).toEqual(['gadget', 'haircut']);
    expect(result.unplanned.find((u) => u.id === 'haircut')).toMatchObject({
      name: 'Haircut',
      parentName: 'Personal Care',
      amount: 1800,
    });
    expect(result.unplanned.find((u) => u.id === 'gadget')?.parentName).toBeNull();
    expect(result.unplannedTotal).toBe(1800 + 3000);

    expect(result.overBudget.map((o) => o.id)).toEqual(['haircut', 'groceries']);
    expect(result.overBudget.find((o) => o.id === 'haircut')).toMatchObject({
      planned: 500,
      amount: 1800,
      over: 1300,
    });
    expect(result.overBudgetTotal).toBe(1300 + 1200);

    expect(result.unplanned.some((u) => u.id === 'bonus')).toBe(false);
    expect(result.overBudget.some((o) => o.id === 'bonus')).toBe(false);
    expect(result.unplanned.some((u) => u.id === 'uncategorized')).toBe(false);
  });

  it('returns empty lists when nothing is unplanned or over budget', async () => {
    vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(SUMMARY as never);

    const result = await ReportsService.getBudgetFlags('u1', 2026, 7);

    expect(result.unplanned).toEqual([]);
    expect(result.overBudget).toEqual([]);
    expect(result.unplannedTotal).toBe(0);
    expect(result.overBudgetTotal).toBe(0);
  });

  it('includes a category flagged unplanned via the per-transaction checkbox, not just the Budget-page flag', async () => {
    // "Groceries" is an ordinary, planned budget line (Budget.isUnplanned is false) —
    // but the user logged one transaction inside it with the "Unplanned" checkbox
    // checked at entry time. That transaction-level flag has to surface here too.
    const summaryWithPlannedCategory = {
      year: 2026,
      month: 7,
      groups: [
        {
          id: 'g-expense',
          name: 'Expenses',
          type: 'EXPENSE',
          planned: 0,
          actual: 0,
          lastMonthActual: 0,
          variance: 0,
          variancePct: 0,
          progressPct: 0,
          categories: [node({ id: 'groceries', name: 'Groceries', planned: 5000, actual: 4200 })],
        },
      ],
    };
    vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(
      summaryWithPlannedCategory as never,
    );
    vi.mocked(TransactionRepository.sumUnplannedByCategory).mockResolvedValue([
      { categoryId: 'groceries', _sum: { amount: 650 } },
    ] as never);

    const result = await ReportsService.getBudgetFlags('u1', 2026, 7);

    expect(result.unplanned).toEqual([
      { id: 'groceries', name: 'Groceries', parentName: null, amount: 650 },
    ]);
    expect(result.unplannedTotal).toBe(650);
  });

  it('counts the whole category once it is Budget-flagged unplanned, instead of double-counting individually-flagged transactions inside it', async () => {
    const summaryWithFlaggedCategory = {
      year: 2026,
      month: 7,
      groups: [
        {
          id: 'g-expense',
          name: 'Expenses',
          type: 'EXPENSE',
          planned: 0,
          actual: 0,
          lastMonthActual: 0,
          variance: 0,
          variancePct: 0,
          progressPct: 0,
          categories: [
            node({ id: 'gadget', name: 'Gadget', planned: 0, actual: 3000, isUnplanned: true }),
          ],
        },
      ],
    };
    vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(
      summaryWithFlaggedCategory as never,
    );
    // Some of that ₹3,000 also came from individually-flagged transactions — must not
    // be added on top of the category's own ₹3,000 actual.
    vi.mocked(TransactionRepository.sumUnplannedByCategory).mockResolvedValue([
      { categoryId: 'gadget', _sum: { amount: 1200 } },
    ] as never);

    const result = await ReportsService.getBudgetFlags('u1', 2026, 7);

    expect(result.unplanned).toEqual([
      { id: 'gadget', name: 'Gadget', parentName: null, amount: 3000 },
    ]);
    expect(result.unplannedTotal).toBe(3000);
  });

  it('surfaces a transaction tagged directly to a category that also has a subcategory, without double-counting the subcategory', async () => {
    // Real bug this covers: "Household > Misc" already had a transaction tagged
    // directly to it (isPlanned: false), then later grew a child ("Grinding") with its
    // own separate spend. Before this fix, collectLeaves treated "Misc" as a pure
    // folder the instant it had any child and never looked at its own data again — the
    // parent's own ₹21,083 unplanned transaction silently vanished from every
    // per-category report while still counting fine in whole-month totals above it.
    const summaryWithDataOnParent = {
      year: 2026,
      month: 8,
      groups: [
        {
          id: 'g-expense',
          name: 'Expenses',
          type: 'EXPENSE',
          planned: 0,
          actual: 0,
          lastMonthActual: 0,
          variance: 0,
          variancePct: 0,
          progressPct: 0,
          categories: [
            node({
              id: 'misc',
              name: 'Misc',
              planned: 2000,
              actual: 23083, // rolled up: own 21083 + child's 2000
              ownPlanned: 2000,
              ownActual: 21083,
              isUnplanned: false,
              children: [
                node({
                  id: 'grinding',
                  name: 'Grinding',
                  planned: 1500,
                  actual: 2000,
                  ownPlanned: 1500,
                  ownActual: 2000,
                }),
              ],
            }),
          ],
        },
      ],
    };
    vi.mocked(BudgetEngineService.getMonthlySummary).mockResolvedValue(
      summaryWithDataOnParent as never,
    );
    vi.mocked(TransactionRepository.sumUnplannedByCategory).mockResolvedValue([
      { categoryId: 'misc', _sum: { amount: 21083 } },
    ] as never);

    const result = await ReportsService.getBudgetFlags('u1', 2026, 8);

    // "Misc" shows its own ₹21,083 — not the rolled-up ₹23,083 that would double-count
    // Grinding, which is separately over budget on its own (₹2,000 actual > ₹1,500 planned).
    expect(result.unplanned).toEqual([
      { id: 'misc', name: 'Misc', parentName: null, amount: 21083 },
    ]);
    expect(result.unplannedTotal).toBe(21083);

    expect(result.overBudget.map((o) => o.id)).toEqual(['misc', 'grinding']);
    expect(result.overBudget.find((o) => o.id === 'misc')).toMatchObject({
      planned: 2000,
      amount: 21083,
      over: 19083,
    });
    expect(result.overBudget.find((o) => o.id === 'grinding')).toMatchObject({
      parentName: 'Misc',
      planned: 1500,
      amount: 2000,
      over: 500,
    });
    // 19083 (misc) + 500 (grinding) — never the rolled-up 23083-2000=21083 a naive
    // parent-only or child-only read would have produced.
    expect(result.overBudgetTotal).toBe(19083 + 500);
  });
});
