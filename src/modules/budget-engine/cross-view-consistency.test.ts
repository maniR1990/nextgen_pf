// This file exists because unit tests alone didn't catch the bug that prompted it: each
// of the Dashboard summary, Transactions page, Calendar widget, and Budget page computed
// "spend for this period" independently, and each was individually correct in isolation
// while disagreeing with the others — a VOID filter present in some but not others,
// uncategorized spend silently dropped by one. A unit test of any single implementation
// would never have caught that; only a test that runs the *same underlying data* through
// more than one of these code paths and compares the results would.
//
// This codebase has no live-DB integration-test harness, so this is the pragmatic
// equivalent: mock the repositories once with one internally-consistent fixture, then
// assert that TransactionService (the Transactions page's source), getPeriodTotals (the
// Dashboard/Calendar/Subscriptions widgets' source), and BudgetEngineService (the Budget
// page's source) all reconcile against each other for that fixture.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import { TransactionService } from '@/modules/transactions/transactions.service';
import { getPeriodTotals } from '@/modules/transactions/period-spend';
import { BudgetEngineRepository } from './budget-engine.repository';
import { BudgetEngineService } from './budget-engine.service';

vi.mock('@/modules/transactions/transactions.repository');
vi.mock('./budget-engine.repository');

beforeEach(() => vi.clearAllMocks());

const EXPENSE_GROUP = {
  id: 'grp-expense',
  name: 'Expenses',
  level: 0,
  parentId: null,
  type: 'EXPENSE',
  color: null,
  icon: null,
  order: 0,
  isSystem: true,
};

const GROCERIES = {
  id: 'cat-groceries',
  name: 'Groceries',
  level: 1,
  parentId: 'grp-expense',
  type: 'EXPENSE',
  color: null,
  icon: null,
  order: 0,
  isSystem: false,
};

describe('period-spend cross-view consistency', () => {
  it('Budget page EXPENSE-group actual reconciles with the Calendar/Transactions-page EXPENSE total', async () => {
    // One "ground truth": ₹24,399.68 of EXPENSE-type spend this period, of which
    // ₹1,741 has no category — the exact split from the real account that surfaced
    // this whole investigation.
    vi.mocked(TransactionRepository.sumByTypeForPeriod).mockResolvedValue([
      { type: 'EXPENSE', _sum: { amount: 24399.68 } },
    ] as never);
    vi.mocked(TransactionRepository.sumUncategorizedByTypeForPeriod).mockResolvedValue([
      { type: 'EXPENSE', _sum: { amount: 1741 } },
    ] as never);
    vi.mocked(BudgetEngineRepository.findCategoriesForUser).mockResolvedValue([
      EXPENSE_GROUP,
      GROCERIES,
    ] as never);
    vi.mocked(BudgetEngineRepository.findBudgetPlans).mockResolvedValue([] as never);
    // The categorized portion: 24399.68 - 1741 = 22658.68.
    vi.mocked(BudgetEngineRepository.findSpendByCategory).mockResolvedValue([
      { categoryId: 'cat-groceries', _sum: { amount: 22658.68 } },
    ] as never);

    const periodTotals = await getPeriodTotals('u1', 2026, 7);
    const txSummary = await TransactionService.getPeriodSummary('u1', 2026, 7);
    const budgetSummary = await BudgetEngineService.getMonthlySummary('u1', 2026, 7);
    const expenseGroup = budgetSummary.groups.find((g) => g.type === 'EXPENSE')!;

    // Budget page's EXPENSE group is EXPENSE-type only (categorized + the Uncategorized
    // row) — the same scope as the Calendar widget's budget pace, not the broader
    // "all outflow types" figure the Dashboard header shows.
    expect(expenseGroup.actual).toBe(24399.68);
    expect(expenseGroup.actual).toBe(periodTotals.totalExpenseOnly);

    // With no INVESTMENT/SINKING_DEPOSIT activity this period, the broader outflow total
    // (Dashboard header, Transactions page) also happens to equal the same number here.
    expect(txSummary.totalExpense).toBe(24399.68);
    expect(periodTotals.totalExpense).toBe(24399.68);
  });

  it('the Dashboard header total and the Budget page EXPENSE-group total legitimately diverge when there is investment spend — not a bug', async () => {
    // ₹5,000 EXPENSE + ₹3,000 INVESTMENT this period. Investing money isn't "spending"
    // in the budget-category sense, so it belongs to its own INVESTMENT group on the
    // Budget page, not the EXPENSE group — the two totals are DIFFERENT concepts here
    // by design, not a reconciliation failure.
    vi.mocked(TransactionRepository.sumByTypeForPeriod).mockResolvedValue([
      { type: 'EXPENSE', _sum: { amount: 5000 } },
      { type: 'INVESTMENT', _sum: { amount: 3000 } },
    ] as never);
    vi.mocked(TransactionRepository.sumUncategorizedByTypeForPeriod).mockResolvedValue(
      [] as never,
    );
    vi.mocked(BudgetEngineRepository.findCategoriesForUser).mockResolvedValue([
      EXPENSE_GROUP,
      GROCERIES,
    ] as never);
    vi.mocked(BudgetEngineRepository.findBudgetPlans).mockResolvedValue([] as never);
    vi.mocked(BudgetEngineRepository.findSpendByCategory).mockResolvedValue([
      { categoryId: 'cat-groceries', _sum: { amount: 5000 } },
    ] as never);

    const periodTotals = await getPeriodTotals('u1', 2026, 7);
    const budgetSummary = await BudgetEngineService.getMonthlySummary('u1', 2026, 7);
    const expenseGroup = budgetSummary.groups.find((g) => g.type === 'EXPENSE')!;

    // Dashboard header: all outflow types combined.
    expect(periodTotals.totalExpense).toBe(8000);
    // Budget page's EXPENSE group: EXPENSE type only — correctly excludes the investment.
    expect(expenseGroup.actual).toBe(5000);
    expect(expenseGroup.actual).toBe(periodTotals.totalExpenseOnly);
  });
});
