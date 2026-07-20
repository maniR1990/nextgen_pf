import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { describe, expect, it } from 'vitest';
import { resolveCreateCategoryParentId } from './TransactionDialog';

const GROUPS: PickerGroup[] = [
  { id: 'grp-expense', name: 'Expenses', type: 'expense', children: [] },
  { id: 'grp-income', name: 'Income', type: 'income', children: [] },
];

describe('resolveCreateCategoryParentId', () => {
  it('passes through an explicit parentId unchanged (L2/L3 creates already know their parent)', () => {
    expect(resolveCreateCategoryParentId(GROUPS, 'l1-grocery', 'EXPENSE')).toBe('l1-grocery');
  });

  it('resolves a null parentId to the matching group id (L1 create) — case-insensitively', () => {
    expect(resolveCreateCategoryParentId(GROUPS, null, 'EXPENSE')).toBe('grp-expense');
  });

  it('matches the correct group when multiple flow types exist', () => {
    expect(resolveCreateCategoryParentId(GROUPS, null, 'INCOME')).toBe('grp-income');
  });

  it('returns null when no flowType is given and parentId is null', () => {
    expect(resolveCreateCategoryParentId(GROUPS, null, undefined)).toBeNull();
  });

  it('returns null when no group matches the given flowType', () => {
    expect(resolveCreateCategoryParentId(GROUPS, null, 'TRANSFER')).toBeNull();
  });

  it('never resolves to a level-0 group create by accident — always returns a real parent or null, never falls back to creating a new top-level group', () => {
    // This is the regression this function exists to prevent: previously, a null
    // parentId + a flowType was sent straight to the API, which interprets "no
    // parentId" as "create a new level-0 group" — the opposite of what the L1 column
    // in the picker means (a category *inside* the existing Expenses group).
    const result = resolveCreateCategoryParentId(GROUPS, null, 'EXPENSE');
    expect(result).not.toBeNull();
    expect(result).toBe('grp-expense');
  });
});
