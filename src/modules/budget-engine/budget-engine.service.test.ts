import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetEngineService } from './budget-engine.service';
import { BudgetEngineRepository } from './budget-engine.repository';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import { BudgetPeriodInvalidError } from '@/lib/api/errors';

vi.mock('./budget-engine.repository');
vi.mock('@/modules/transactions/transactions.repository');

const MOCK_CATEGORY = { id: 'cat1', label: 'Groceries', plannedAmount: 5000 };

beforeEach(() => vi.clearAllMocks());

describe('BudgetEngineService.getMonthlySummary', () => {
  it('returns envelope with planned and spent per category', async () => {
    vi.mocked(BudgetEngineRepository.findCategoriesForUser).mockResolvedValue([MOCK_CATEGORY] as never);
    vi.mocked(BudgetEngineRepository.findOverrides).mockResolvedValue([]);
    vi.mocked(TransactionRepository.sumByPeriod).mockResolvedValue({ _sum: { amount: 1200 } } as never);

    const result = await BudgetEngineService.getMonthlySummary('u1', 2024, 6);

    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].plannedAmount).toBe(5000);
    expect(result.categories[0].spentAmount).toBe(1200);
    expect(result.categories[0].remainingAmount).toBe(3800);
  });

  it('applies a BudgetOverride over the CategoryNode plannedAmount', async () => {
    vi.mocked(BudgetEngineRepository.findCategoriesForUser).mockResolvedValue([MOCK_CATEGORY] as never);
    vi.mocked(BudgetEngineRepository.findOverrides).mockResolvedValue([
      { categoryId: 'cat1', planned: 8000 },
    ] as never);
    vi.mocked(TransactionRepository.sumByPeriod).mockResolvedValue({ _sum: { amount: 0 } } as never);

    const result = await BudgetEngineService.getMonthlySummary('u1', 2024, 6);
    expect(result.categories[0].plannedAmount).toBe(8000);
  });

  it('throws BudgetPeriodInvalidError for year < 2020', async () => {
    await expect(BudgetEngineService.getMonthlySummary('u1', 2019, 6)).rejects.toThrow(BudgetPeriodInvalidError);
  });

  it('throws BudgetPeriodInvalidError for month out of range', async () => {
    await expect(BudgetEngineService.getMonthlySummary('u1', 2024, 13)).rejects.toThrow(BudgetPeriodInvalidError);
  });
});

describe('BudgetEngineService.getImpact', () => {
  it('calculates remaining budget after a hypothetical transaction', async () => {
    vi.mocked(BudgetEngineRepository.findCategoryById).mockResolvedValue({ ...MOCK_CATEGORY, userId: 'u1' } as never);
    vi.mocked(BudgetEngineRepository.findOverrides).mockResolvedValue([]);
    vi.mocked(TransactionRepository.sumByPeriod).mockResolvedValue({ _sum: { amount: 2000 } } as never);

    const result = await BudgetEngineService.getImpact('u1', {
      categoryId: 'cat1',
      amount: 500,
      budgetPeriodYear: 2024,
      budgetPeriodMonth: 6,
    });

    expect(result.currentSpend).toBe(2000);
    expect(result.projectedSpend).toBe(2500);
    expect(result.remainingAfter).toBe(2500);
  });
});

describe('BudgetEngineService.updateCategoryPlanned', () => {
  it('upserts a BudgetOverride for the period', async () => {
    vi.mocked(BudgetEngineRepository.upsertOverride).mockResolvedValue({ planned: 6000 } as never);
    const result = await BudgetEngineService.updateCategoryPlanned('u1', 2024, 6, 'cat1', 6000);
    expect(result.planned).toBe(6000);
  });
});
