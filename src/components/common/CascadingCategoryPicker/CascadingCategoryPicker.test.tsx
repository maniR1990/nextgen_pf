import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CascadingCategoryPicker } from './CascadingCategoryPicker';

afterEach(() => cleanup());

const GROUPS: PickerGroup[] = [
  {
    id: 'g-expense',
    name: 'Expenses',
    type: 'EXPENSE',
    children: [
      { id: 'l1-groceries', name: 'Groceries', isLeaf: true, children: [] },
      {
        id: 'l1-grocery-tree',
        name: 'Grocery',
        isLeaf: false,
        children: [
          {
            id: 'l2-meat',
            name: 'Meat',
            isLeaf: false,
            children: [{ id: 'l3-chicken', name: 'chicken' }],
          },
        ],
      },
    ],
  },
];

describe('CascadingCategoryPicker — inline create', () => {
  // Regression test for a real bug: creating a category succeeded on the server, but the
  // picker never selected it — handleL1Change looked the new id up in `groups` (the `l1Options`
  // built from the `groups` prop) to decide what to do, and that prop is still the OLD list at
  // the moment of creation (the parent's query hasn't refetched yet). The lookup missed, so
  // onChange was never called and the newly created category silently went unselected.
  it('selects a newly created L1 category immediately, even though `groups` has not refetched yet', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCreateL1 = vi.fn().mockResolvedValue('new-l1-id');

    render(
      <CascadingCategoryPicker
        groups={GROUPS}
        value={null}
        onChange={onChange}
        onCreateL1={onCreateL1}
      />,
    );

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Personal Care');
    await user.click(await screen.findByText('Create "Personal Care"'));

    expect(onCreateL1).toHaveBeenCalledWith('Personal Care');
    // The critical assertion: onChange must fire with the real new id, not be skipped
    // because "new-l1-id" isn't in GROUPS yet.
    expect(onChange).toHaveBeenCalledWith('new-l1-id');
  });

  it('selects a newly created L2 category immediately under the active L1', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCreateL2 = vi.fn().mockResolvedValue('new-l2-id');

    render(
      <CascadingCategoryPicker
        groups={GROUPS}
        value="l1-grocery-tree"
        onChange={onChange}
        onCreateL2={onCreateL2}
      />,
    );

    await user.click(screen.getByText('Select subcategory…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Snacks');
    await user.click(await screen.findByText('Create "Snacks"'));

    expect(onCreateL2).toHaveBeenCalledWith('Snacks', 'l1-grocery-tree');
    expect(onChange).toHaveBeenCalledWith('new-l2-id');
  });

  it('selects a newly created L3 item immediately under the active L2', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onCreateL3 = vi.fn().mockResolvedValue('new-l3-id');

    render(
      <CascadingCategoryPicker
        groups={GROUPS}
        value="l2-meat"
        onChange={onChange}
        onCreateL3={onCreateL3}
      />,
    );

    await user.click(screen.getByText('Add specific item…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));

    expect(onCreateL3).toHaveBeenCalledWith('egg', 'l2-meat');
    expect(onChange).toHaveBeenCalledWith('new-l3-id');
  });
});
