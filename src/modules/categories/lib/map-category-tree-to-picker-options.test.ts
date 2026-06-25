import { describe, expect, it } from 'vitest';
import { mapCategoryTreeToPickerOptions } from './map-category-tree-to-picker-options';
import type { CategoryTreeNode } from '../categories.types';

function baseNode(overrides: Partial<CategoryTreeNode> & Pick<CategoryTreeNode, 'id' | 'name' | 'level'>): CategoryTreeNode {
  return {
    slug: overrides.id,
    parentId: null,
    path: overrides.id,
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
    ...overrides,
  };
}

const sampleTree: CategoryTreeNode[] = [
  baseNode({
    id: 'expense',
    name: 'Expenses',
    level: 0,
    type: 'EXPENSE',
    children: [
      baseNode({
        id: 'housing',
        name: 'Housing',
        level: 1,
        parentId: 'expense',
        children: [
          baseNode({ id: 'rent', name: 'Rent / EMI', level: 2, parentId: 'housing' }),
          baseNode({ id: 'utilities', name: 'Electricity', level: 2, parentId: 'housing' }),
        ],
      }),
      baseNode({
        id: 'misc',
        name: 'Misc',
        level: 1,
        parentId: 'expense',
      }),
    ],
  }),
  baseNode({
    id: 'income',
    name: 'Income',
    level: 0,
    type: 'INCOME',
    children: [
      baseNode({
        id: 'salary',
        name: 'Salary',
        level: 1,
        parentId: 'income',
        type: 'INCOME',
      }),
    ],
  }),
];

describe('mapCategoryTreeToPickerOptions', () => {
  it('includes L2 subcategories with L1 parentLabel', () => {
    const options = mapCategoryTreeToPickerOptions(sampleTree);

    expect(options).toContainEqual({
      id: 'rent',
      label: 'Rent / EMI',
      parentLabel: 'Housing',
      depth: 2,
      type: 'expense',
    });
    expect(options).toContainEqual({
      id: 'utilities',
      label: 'Electricity',
      parentLabel: 'Housing',
      depth: 2,
      type: 'expense',
    });
  });

  it('includes leaf L1 categories with L0 parentLabel', () => {
    const options = mapCategoryTreeToPickerOptions(sampleTree);

    expect(options).toContainEqual({
      id: 'misc',
      label: 'Misc',
      parentLabel: 'Expenses',
      depth: 1,
      type: 'expense',
    });
    expect(options).toContainEqual({
      id: 'salary',
      label: 'Salary',
      parentLabel: 'Income',
      depth: 1,
      type: 'income',
    });
  });

  it('excludes L0 groups and non-leaf L1 categories', () => {
    const options = mapCategoryTreeToPickerOptions(sampleTree);
    const ids = options.map((o) => o.id);

    expect(ids).not.toContain('expense');
    expect(ids).not.toContain('income');
    expect(ids).not.toContain('housing');
  });
});
