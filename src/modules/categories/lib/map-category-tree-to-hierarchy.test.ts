import { fromCategoryFlowType } from '@/constants/categories';
import { describe, expect, it } from 'vitest';
import type { CategoryTreeNode } from '../categories.types';
import { mapCategoryTreeToHierarchy } from './map-category-tree-to-hierarchy';

const sampleTree: CategoryTreeNode[] = [
  {
    id: 'income-id',
    name: 'Income',
    slug: 'income',
    parentId: null,
    level: 0,
    path: 'income/income',
    type: 'INCOME',
    monthlyBudget: 100_000,
    budgetRollover: false,
    matchRules: [],
    color: null,
    icon: '💰',
    order: 0,
    isSystem: false,
    isActive: true,
    monthlySpend: 0,
    budget: 100_000,
    archivedAt: null,
    children: [
      {
        id: 'salary-id',
        name: 'Salary',
        slug: 'salary',
        parentId: 'income-id',
        level: 1,
        path: 'income/income/salary',
        type: 'INCOME',
        monthlyBudget: 80_000,
        budgetRollover: false,
        matchRules: [],
        color: null,
        icon: null,
        order: 0,
        isSystem: false,
        isActive: true,
        monthlySpend: 0,
        budget: 80_000,
        archivedAt: null,
        children: [],
      },
    ],
  },
];

describe('mapCategoryTreeToHierarchy', () => {
  it('maps API tree nodes to hierarchy JSON with level types', () => {
    const result = mapCategoryTreeToHierarchy(sampleTree);

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe(fromCategoryFlowType('INCOME'));
    expect(result[0]?.emoji).toBe('💰');
    expect(result[0]?.monthlyBudget).toBeUndefined();
    expect(result[0]?.children?.[0]?.name).toBe('Salary');
    expect(result[0]?.children?.[0]?.level).toBe(1);
  });
});
