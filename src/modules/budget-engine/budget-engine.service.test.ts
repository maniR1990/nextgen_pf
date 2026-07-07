import { BudgetPeriodInvalidError, CategoryNotFoundError } from '@/lib/api/errors';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BudgetEngineRepository } from './budget-engine.repository';
import { BudgetEngineService } from './budget-engine.service';

vi.mock('./budget-engine.repository');
vi.mock('@/modules/transactions/transactions.repository');

const EXPENSE_GROUP = {
  id: 'group1',
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
  id: 'cat1',
  name: 'Groceries',
  level: 1,
  parentId: 'group1',
  type: 'EXPENSE',
  color: null,
  icon: null,
  order: 0,
  isSystem: false,
};

beforeEach(() => vi.clearAllMocks());

describe('BudgetEngineService.getMonthlySummary', () => {
  it('rolls up planned and actual for a single leaf category', async () => {
    vi.mocked(BudgetEngineRepository.findCategoriesForUser).mockResolvedValue([
      EXPENSE_GROUP,
      GROCERIES,
    ] as never);
    vi.mocked(BudgetEngineRepository.findBudgetPlans).mockResolvedValue([
      { categoryId: 'cat1', plannedAmount: 5000, isRecurring: false, isUnplanned: false },
    ] as never);
    vi.mocked(BudgetEngineRepository.findSpendByCategory).mockResolvedValue([
      { categoryId: 'cat1', _sum: { amount: 1200 } },
    ] as never);

    const result = await BudgetEngineService.getMonthlySummary('u1', 2024, 6);

    const leaf = result.groups[0]!.categories[0]!;
    expect(leaf.planned).toBe(5000);
    expect(leaf.actual).toBe(1200);
    expect(leaf.variance).toBe(1200 - 5000);
  });

  it('marks a category settled when its plan has settledAt, independent of actual spend', async () => {
    vi.mocked(BudgetEngineRepository.findCategoriesForUser).mockResolvedValue([
      EXPENSE_GROUP,
      GROCERIES,
    ] as never);
    vi.mocked(BudgetEngineRepository.findBudgetPlans).mockResolvedValue([
      {
        categoryId: 'cat1',
        plannedAmount: 6000,
        dueDay: 6,
        settledAt: new Date('2026-07-07'),
        settledTransactionId: 'tx1',
      },
    ] as never);
    // No spend recorded at all this period — settlement must win over the actual>=planned check.
    vi.mocked(BudgetEngineRepository.findSpendByCategory).mockResolvedValue([] as never);

    const result = await BudgetEngineService.getMonthlySummary('u1', 2024, 6);

    const leaf = result.groups[0]!.categories[0]!;
    expect(leaf.isSettled).toBe(true);
    expect(leaf.settledTransactionId).toBe('tx1');
    expect(leaf.actual).toBe(0);
  });

  it('leaves isSettled false and settledTransactionId null when no plan exists for the period', async () => {
    vi.mocked(BudgetEngineRepository.findCategoriesForUser).mockResolvedValue([
      EXPENSE_GROUP,
      GROCERIES,
    ] as never);
    vi.mocked(BudgetEngineRepository.findBudgetPlans).mockResolvedValue([] as never);
    vi.mocked(BudgetEngineRepository.findSpendByCategory).mockResolvedValue([] as never);

    const result = await BudgetEngineService.getMonthlySummary('u1', 2024, 6);

    const leaf = result.groups[0]!.categories[0]!;
    expect(leaf.isSettled).toBe(false);
    expect(leaf.settledTransactionId).toBeNull();
  });

  it('throws BudgetPeriodInvalidError for year < 2020', async () => {
    await expect(BudgetEngineService.getMonthlySummary('u1', 2019, 6)).rejects.toThrow(
      BudgetPeriodInvalidError,
    );
  });

  it('throws BudgetPeriodInvalidError for month out of range', async () => {
    await expect(BudgetEngineService.getMonthlySummary('u1', 2024, 13)).rejects.toThrow(
      BudgetPeriodInvalidError,
    );
  });
});

describe('BudgetEngineService.getImpact', () => {
  it('calculates remaining budget after a hypothetical transaction', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue({
      ...GROCERIES,
    } as never);
    vi.mocked(BudgetEngineRepository.findBudgetPlan).mockResolvedValue({
      plannedAmount: 5000,
    } as never);
    vi.mocked(TransactionRepository.sumByPeriod).mockResolvedValue({
      _sum: { amount: 2000 },
    } as never);

    const result = await BudgetEngineService.getImpact('u1', {
      categoryId: 'cat1',
      amount: 500,
      budgetPeriodYear: 2024,
      budgetPeriodMonth: 6,
    });

    expect(result.currentSpend).toBe(2000);
    expect(result.projectedSpend).toBe(2500);
    expect(result.remainingAfter).toBe(2500);
    expect(result.willExceed).toBe(false);
  });

  it('flags willExceed once the hypothetical transaction pushes spend past the plan', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue({
      ...GROCERIES,
    } as never);
    vi.mocked(BudgetEngineRepository.findBudgetPlan).mockResolvedValue({
      plannedAmount: 1000,
    } as never);
    vi.mocked(TransactionRepository.sumByPeriod).mockResolvedValue({
      _sum: { amount: 800 },
    } as never);

    const result = await BudgetEngineService.getImpact('u1', {
      categoryId: 'cat1',
      amount: 500,
      budgetPeriodYear: 2024,
      budgetPeriodMonth: 6,
    });

    expect(result.willExceed).toBe(true);
  });
});

describe('BudgetEngineService.updateCategoryPlanned', () => {
  it('patches plannedAmount, isRecurring, isUnplanned and dueDay unchanged (settlement untouched)', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue({
      ...GROCERIES,
    } as never);
    vi.mocked(BudgetEngineRepository.upsertBudgetPlan).mockResolvedValue({} as never);

    await BudgetEngineService.updateCategoryPlanned('u1', 2024, 6, 'cat1', {
      planned: 6000,
      isRecurring: true,
      dueDay: 5,
    });

    expect(BudgetEngineRepository.upsertBudgetPlan).toHaveBeenCalledWith('u1', 2024, 6, 'cat1', {
      plannedAmount: 6000,
      isRecurring: true,
      dueDay: 5,
    });
  });

  it('settles with a linked transaction — settledAt set, settlementMode MANUAL', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue({
      ...GROCERIES,
    } as never);
    vi.mocked(BudgetEngineRepository.upsertBudgetPlan).mockResolvedValue({} as never);

    await BudgetEngineService.updateCategoryPlanned('u1', 2024, 6, 'cat1', {
      settled: true,
      settledTransactionId: 'tx1',
    });

    const call = vi.mocked(BudgetEngineRepository.upsertBudgetPlan).mock.calls[0]!;
    expect(call[4]).toMatchObject({
      settledTransactionId: 'tx1',
      settlementMode: 'MANUAL',
    });
    expect((call[4] as { settledAt: Date }).settledAt).toBeInstanceOf(Date);
  });

  it('settles with no linked transaction — pure manual "mark as paid"', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue({
      ...GROCERIES,
    } as never);
    vi.mocked(BudgetEngineRepository.upsertBudgetPlan).mockResolvedValue({} as never);

    await BudgetEngineService.updateCategoryPlanned('u1', 2024, 6, 'cat1', { settled: true });

    const call = vi.mocked(BudgetEngineRepository.upsertBudgetPlan).mock.calls[0]!;
    expect(call[4]).toMatchObject({ settledTransactionId: null, settlementMode: 'MANUAL' });
  });

  it('unsettles (undo) — clears settledAt, settledTransactionId and settlementMode', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue({
      ...GROCERIES,
    } as never);
    vi.mocked(BudgetEngineRepository.upsertBudgetPlan).mockResolvedValue({} as never);

    await BudgetEngineService.updateCategoryPlanned('u1', 2024, 6, 'cat1', { settled: false });

    expect(BudgetEngineRepository.upsertBudgetPlan).toHaveBeenCalledWith('u1', 2024, 6, 'cat1', {
      settledAt: null,
      settledTransactionId: null,
      settlementMode: null,
    });
  });

  it('leaves settlement fields untouched when settled is not provided', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue({
      ...GROCERIES,
    } as never);
    vi.mocked(BudgetEngineRepository.upsertBudgetPlan).mockResolvedValue({} as never);

    await BudgetEngineService.updateCategoryPlanned('u1', 2024, 6, 'cat1', { planned: 100 });

    const call = vi.mocked(BudgetEngineRepository.upsertBudgetPlan).mock.calls[0]!;
    expect(call[4]).not.toHaveProperty('settledAt');
    expect(call[4]).not.toHaveProperty('settledTransactionId');
    expect(call[4]).not.toHaveProperty('settlementMode');
  });

  it('throws CategoryNotFoundError when the category does not belong to the user', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue(null as never);

    await expect(
      BudgetEngineService.updateCategoryPlanned('u1', 2024, 6, 'ghost', { settled: true }),
    ).rejects.toThrow(CategoryNotFoundError);
  });
});
