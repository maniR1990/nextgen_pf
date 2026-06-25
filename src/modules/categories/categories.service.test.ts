import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import {
  CategoryHasTransactionsError,
  CategoryNotFoundError,
  ConflictError,
} from '@/lib/api/errors';

vi.mock('./categories.repository');

const userId = 'u1';

const mockCategory = {
  id: 'c1',
  userId,
  name: 'Groceries',
  slug: 'groceries',
  parentId: 'g1',
  level: 1,
  path: 'expense/food/groceries',
  type: 'EXPENSE' as const,
  monthlyBudget: 5000,
  budgetRollover: false,
  matchRules: [],
  color: null,
  icon: null,
  order: 0,
  isSystem: false,
  isActive: true,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGroup = {
  id: 'g1',
  userId,
  name: 'Food',
  slug: 'food',
  parentId: null,
  level: 0,
  path: 'expense/food',
  type: 'EXPENSE' as const,
  monthlyBudget: 0,
  budgetRollover: false,
  matchRules: [],
  color: null,
  icon: null,
  order: 0,
  isSystem: false,
  isActive: true,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('CategoriesService.list', () => {
  it('returns tree with rolled-up monthlySpend', async () => {
    vi.mocked(CategoriesRepository.findAccessible).mockResolvedValue([mockGroup, mockCategory]);
    vi.mocked(CategoriesRepository.countAccessible).mockResolvedValue(2);
    vi.mocked(CategoriesRepository.spendByCategoryIds).mockResolvedValue([
      { categoryId: 'c1', _sum: { amount: 1500 } },
    ] as never);

    const { data, meta } = await CategoriesService.list(userId, { type: 'expense' });
    expect(data).toHaveLength(1);
    expect(data[0].children[0].monthlySpend).toBe(1500);
    expect(data[0].monthlySpend).toBe(1500);
    expect(meta.totalNodes).toBe(2);
  });
});

describe('CategoriesService.create', () => {
  it('requires type for top-level group', async () => {
    await expect(
      CategoriesService.create(userId, { name: 'Food', parentId: null }),
    ).rejects.toThrow(ConflictError);
  });
});

describe('CategoriesService.delete', () => {
  it('soft-archives when no transactions exist', async () => {
    vi.mocked(CategoriesRepository.findById).mockResolvedValue(mockCategory);
    vi.mocked(CategoriesRepository.countTransactions).mockResolvedValue(0);
    vi.mocked(CategoriesRepository.findAccessible).mockResolvedValue([mockGroup, mockCategory]);
    vi.mocked(CategoriesRepository.archiveMany).mockResolvedValue([]);

    const result = await CategoriesService.delete('c1', userId);
    expect(result.archived).toBe(true);
    expect(CategoriesRepository.archiveMany).toHaveBeenCalled();
  });

  it('blocks delete when transactions exist', async () => {
    vi.mocked(CategoriesRepository.findById).mockResolvedValue(mockCategory);
    vi.mocked(CategoriesRepository.countTransactions).mockResolvedValue(5);
    vi.mocked(CategoriesRepository.findAccessible).mockResolvedValue([mockGroup, mockCategory]);

    await expect(CategoriesService.delete('c1', userId)).rejects.toThrow(
      CategoryHasTransactionsError,
    );
  });
});

describe('CategoriesService.getStats', () => {
  it('returns trend and variance', async () => {
    vi.mocked(CategoriesRepository.findById).mockResolvedValue(mockCategory);
    vi.mocked(CategoriesRepository.spendByCategoryIds).mockResolvedValue([
      { categoryId: 'c1', _sum: { amount: 2000 } },
    ] as never);
    vi.mocked(CategoriesRepository.spendTrend).mockResolvedValue([]);
    vi.mocked(CategoriesRepository.topTransactions).mockResolvedValue([]);

    const stats = await CategoriesService.getStats('c1', userId);
    expect(stats.currentMonthSpend).toBe(2000);
    expect(stats.budgetVariance).toBe(3000);
    expect(stats.monthlyTrend).toHaveLength(6);
  });
});

describe('CategoriesService.getById', () => {
  it('returns subtree with spend', async () => {
    vi.mocked(CategoriesRepository.findById).mockResolvedValue(mockCategory);
    vi.mocked(CategoriesRepository.findAccessible).mockResolvedValue([mockGroup, mockCategory]);
    vi.mocked(CategoriesRepository.spendByCategoryIds).mockResolvedValue([
      { categoryId: 'c1', _sum: { amount: 900 } },
    ] as never);

    const node = await CategoriesService.getById('c1', userId);
    expect(node.id).toBe('c1');
    expect(node.monthlySpend).toBe(900);
  });
});

describe('CategoriesService.update', () => {
  it('throws for wrong owner', async () => {
    vi.mocked(CategoriesRepository.findById).mockResolvedValue({ ...mockCategory, userId: 'other' });
    await expect(
      CategoriesService.update('c1', userId, { name: 'New' }),
    ).rejects.toThrow(CategoryNotFoundError);
  });
});
