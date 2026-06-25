import { describe, it, expect } from 'vitest';
import {
  buildCategoryTree,
  buildPath,
  collectDescendantIds,
  isDescendant,
  rollupMonthlySpend,
  slugify,
} from './category-tree';

describe('category-tree', () => {
  it('slugifies names', () => {
    expect(slugify('Groceries & More')).toBe('groceries-more');
  });

  it('builds materialized paths', () => {
    expect(buildPath('EXPENSE', 'food')).toBe('expense/food');
    expect(buildPath('EXPENSE', 'groceries', 'expense/food')).toBe('expense/food/groceries');
  });

  it('builds nested tree ordered by order field', () => {
    const tree = buildCategoryTree([
      {
        id: 'g1',
        name: 'Food',
        slug: 'food',
        parentId: null,
        level: 0,
        path: 'expense/food',
        type: 'EXPENSE',
        monthlyBudget: 0,
        budgetRollover: false,
        matchRules: [],
        color: null,
        icon: null,
        order: 0,
        isSystem: false,
        isActive: true,
        monthlySpend: 0,
        budget: 0,
        archivedAt: null,
        children: [],
      },
      {
        id: 'c1',
        name: 'Groceries',
        slug: 'groceries',
        parentId: 'g1',
        level: 1,
        path: 'expense/food/groceries',
        type: 'EXPENSE',
        monthlyBudget: 5000,
        budgetRollover: false,
        matchRules: [],
        color: null,
        icon: null,
        order: 0,
        isSystem: false,
        isActive: true,
        monthlySpend: 1200,
        budget: 5000,
        archivedAt: null,
        children: [],
      },
    ]);
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
    rollupMonthlySpend(tree);
    expect(tree[0].monthlySpend).toBe(1200);
  });

  it('detects descendants for reparent guard', () => {
    const flat = [
      { id: 'a', parentId: null },
      { id: 'b', parentId: 'a' },
      { id: 'c', parentId: 'b' },
    ];
    expect(isDescendant(flat, 'a', 'c')).toBe(true);
    expect(collectDescendantIds(flat, 'a').size).toBe(3);
  });
});
