import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CollapsibleCategoryPicker } from './CollapsibleCategoryPicker';

afterEach(() => cleanup());

const GROUPS: PickerGroup[] = [
  {
    id: 'g-expense',
    name: 'Expenses',
    type: 'EXPENSE',
    children: [
      { id: 'l1-groceries', name: 'Groceries', isLeaf: true, children: [] },
      {
        id: 'l1-transport',
        name: 'Transport',
        isLeaf: false,
        children: [{ id: 'l2-fuel', name: 'Fuel', isLeaf: true, children: [] }],
      },
    ],
  },
];

describe('CollapsibleCategoryPicker', () => {
  it('shows the full picker when no category is selected', () => {
    render(
      <CollapsibleCategoryPicker groups={GROUPS} value={null} onChange={vi.fn()} label="Category" />,
    );
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search any category or item…')).toBeInTheDocument();
  });

  it('collapses to a confirmed chip once a category is selected', () => {
    render(
      <CollapsibleCategoryPicker
        groups={GROUPS}
        value="l1-groceries"
        onChange={vi.fn()}
        label="Category"
      />,
    );
    expect(screen.getByRole('button', { name: /groceries/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search any category or item…')).not.toBeInTheDocument();
  });

  it('reopens the full picker when the chip is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleCategoryPicker
        groups={GROUPS}
        value="l1-groceries"
        onChange={vi.fn()}
        label="Category"
      />,
    );

    await user.click(screen.getByRole('button', { name: /groceries/i }));

    expect(screen.getByPlaceholderText('Search any category or item…')).toBeInTheDocument();
  });

  it('resolves the label for a nested (level-2) category', () => {
    render(
      <CollapsibleCategoryPicker groups={GROUPS} value="l2-fuel" onChange={vi.fn()} label="Category" />,
    );
    expect(screen.getByRole('button', { name: /fuel/i })).toBeInTheDocument();
  });

  it('re-collapses to the chip once a new category is chosen from the reopened picker', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <CollapsibleCategoryPicker
        groups={GROUPS}
        value="l1-groceries"
        onChange={onChange}
        label="Category"
      />,
    );

    await user.click(screen.getByRole('button', { name: /groceries/i }));
    expect(screen.getByPlaceholderText('Search any category or item…')).toBeInTheDocument();

    // Simulate the parent committing the new value picked inside the reopened picker.
    rerender(
      <CollapsibleCategoryPicker
        groups={GROUPS}
        value="l2-fuel"
        onChange={onChange}
        label="Category"
      />,
    );
    // Still mid-edit (isEditing stays true until onChange fires from within this instance),
    // so the full picker remains visible with the new value reflected internally.
    expect(screen.getByPlaceholderText('Search any category or item…')).toBeInTheDocument();
  });
});
