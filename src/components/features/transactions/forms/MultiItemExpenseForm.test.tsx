import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { useTransactionFormStore } from '@/store/transactionFormStore';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MultiItemExpenseForm } from './MultiItemExpenseForm';

afterEach(() => cleanup());

const GROUPS: PickerGroup[] = [
  {
    id: 'g-expense',
    name: 'Expenses',
    type: 'EXPENSE',
    children: [
      {
        id: 'l1-grocery',
        name: 'Grocery',
        isLeaf: false,
        children: [
          {
            id: 'l2-meat',
            name: 'Meat',
            isLeaf: false,
            children: [{ id: 'l3-chicken', name: 'chicken', color: undefined }],
          },
        ],
      },
    ],
  },
];

function resetStore() {
  act(() => useTransactionFormStore.getState().reset());
}

function seedOneItem() {
  act(() => useTransactionFormStore.getState().setMultiItem(true));
}

describe('MultiItemExpenseForm', () => {
  beforeEach(() => {
    resetStore();
    seedOneItem();
  });
  afterEach(() => resetStore());

  it('renders one blank row by default (seeded by setMultiItem)', () => {
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    expect(screen.getByText('1 item · ₹0')).toBeInTheDocument();
  });

  it('disables "Add item" while the current (last) row is unresolved', () => {
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    expect(screen.getByRole('button', { name: /add item/i })).toBeDisabled();
  });

  it('auto-advances to a fresh blank row once the current row gets a category and amount — no click needed', () => {
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    const itemId = useTransactionFormStore.getState().items[0].id;
    act(() =>
      useTransactionFormStore.getState().updateItem(itemId, { categoryId: 'l3-chicken', amount: '805' }),
    );
    expect(useTransactionFormStore.getState().items).toHaveLength(2);
    expect(screen.getByText('2 items · ₹805')).toBeInTheDocument();
  });

  it('does not stack a second unresolved row when "Add item" is clicked while the first is still blank', async () => {
    const user = userEvent.setup();
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    await user.click(screen.getByRole('button', { name: /add item/i }));
    expect(useTransactionFormStore.getState().items).toHaveLength(1);
  });

  it('updates the running total as amounts are typed', async () => {
    const user = userEvent.setup();
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    const amountInput = screen.getByLabelText('Amount for item 1');
    await user.type(amountInput, '805');
    expect(screen.getByText('1 item · ₹805')).toBeInTheDocument();
  });

  it('Enter inside the amount field does not submit the surrounding form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: Event) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <MultiItemExpenseForm categoryGroups={GROUPS} />
      </form>,
    );
    const amountInput = screen.getByLabelText('Amount for item 1');
    await user.type(amountInput, '805{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('removes a row and updates the total', async () => {
    const user = userEvent.setup();
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    const itemId = useTransactionFormStore.getState().items[0].id;
    act(() =>
      useTransactionFormStore.getState().updateItem(itemId, { categoryId: 'l3-chicken', amount: '805' }),
    );
    await user.type(screen.getByLabelText('Amount for item 2'), '140');
    expect(screen.getByText('2 items · ₹945')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove item 2/i }));
    expect(screen.getByText('1 item · ₹805')).toBeInTheDocument();
  });

  it('disables removing the last remaining row', () => {
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    expect(screen.getByRole('button', { name: /remove item 1/i })).toBeDisabled();
  });

  it('selecting a category via the compact picker updates the item in the store', async () => {
    const user = userEvent.setup();
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'chicken');
    await user.click(await screen.findByText('chicken'));

    const itemId = useTransactionFormStore.getState().items[0].id;
    expect(useTransactionFormStore.getState().items.find((it) => it.id === itemId)?.categoryId).toBe(
      'l3-chicken',
    );
  });

  it('does not render a per-item note field', () => {
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    expect(screen.queryByPlaceholderText('Note (optional)')).not.toBeInTheDocument();
  });

  it('shows the category picker as a single compact trigger, not a multi-column cascade', () => {
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    expect(screen.queryByPlaceholderText('Search any category or item…')).not.toBeInTheDocument();
    expect(screen.queryByText('MAIN CATEGORY')).not.toBeInTheDocument();
    expect(screen.getByText('Select category…')).toBeInTheDocument();
  });

  it('shows a required error on the category picker when the row is flagged invalid', () => {
    const itemId = useTransactionFormStore.getState().items[0].id;
    act(() => useTransactionFormStore.getState().setInvalidItemIds([itemId]));
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('flags the amount input as an error when the row is invalid and amount is unset', () => {
    const itemId = useTransactionFormStore.getState().items[0].id;
    act(() => useTransactionFormStore.getState().setInvalidItemIds([itemId]));
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);
    expect(screen.getByLabelText('Amount for item 1')).toHaveClass(
      'multi-item-form__row-amount-input--error',
    );
  });
});

describe('MultiItemExpenseForm — placing a new item under an existing subcategory', () => {
  beforeEach(() => {
    resetStore();
    seedOneItem();
  });
  afterEach(() => resetStore());

  it('lets an existing subcategory (not just leaf items) be picked directly, e.g. "Meat" itself', async () => {
    const user = userEvent.setup();
    render(<MultiItemExpenseForm categoryGroups={GROUPS} />);

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Meat');
    await user.click(await screen.findByText('Meat'));

    expect(useTransactionFormStore.getState().items[0].categoryId).toBe('l2-meat');
  });

  it('typing a brand-new item name and creating it reveals a "place under" step instead of flattening it to a new top-level category', async () => {
    const user = userEvent.setup();
    const onCreateCategory = vi.fn();
    render(<MultiItemExpenseForm categoryGroups={GROUPS} onCreateCategory={onCreateCategory} />);

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));

    // Nothing created yet at this point — the row is just asking where "egg" belongs.
    expect(onCreateCategory).not.toHaveBeenCalled();
    expect(screen.getByText('Place "egg" under…')).toBeInTheDocument();
  });

  it('creates the new item nested under an EXISTING subcategory picked in the second step (egg under Meat)', async () => {
    const user = userEvent.setup();
    const onCreateCategory = vi.fn().mockResolvedValue('new-egg-id');
    render(<MultiItemExpenseForm categoryGroups={GROUPS} onCreateCategory={onCreateCategory} />);

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));

    await user.click(screen.getByText('Search category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Meat');
    await user.click(await screen.findByText('Meat'));

    expect(onCreateCategory).toHaveBeenCalledWith('egg', 'l2-meat');
    expect(useTransactionFormStore.getState().items[0].categoryId).toBe('new-egg-id');
    // Back to the normal compact picker, resolved.
    expect(screen.queryByText(/place "egg" under/i)).not.toBeInTheDocument();
  });

  it('creating a brand-new parent in the second step also creates the pending item under it', async () => {
    const user = userEvent.setup();
    const onCreateCategory = vi
      .fn()
      .mockResolvedValueOnce('new-parent-id')
      .mockResolvedValueOnce('new-egg-id');
    render(<MultiItemExpenseForm categoryGroups={GROUPS} onCreateCategory={onCreateCategory} />);

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));

    await user.click(screen.getByText('Search category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Dairy');
    await user.click(await screen.findByText('Create "Dairy"'));

    expect(onCreateCategory).toHaveBeenNthCalledWith(1, 'Dairy', null, 'EXPENSE');
    expect(onCreateCategory).toHaveBeenNthCalledWith(2, 'egg', 'new-parent-id');
    expect(useTransactionFormStore.getState().items[0].categoryId).toBe('new-egg-id');
  });

  it('starting a new create on an already-categorized row does not wipe its existing category while the create is pending', async () => {
    const user = userEvent.setup();
    render(<MultiItemExpenseForm categoryGroups={GROUPS} onCreateCategory={vi.fn()} />);

    // Resolve the row to "chicken" first.
    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'chicken');
    await user.click(await screen.findByText('chicken'));
    expect(useTransactionFormStore.getState().items[0].categoryId).toBe('l3-chicken');

    // Reopen and start creating something new — the old value must survive until the
    // create either completes or is cancelled, not get wiped the instant "Create" is clicked.
    await user.click(screen.getByText('chicken'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));

    expect(useTransactionFormStore.getState().items[0].categoryId).toBe('l3-chicken');
  });

  it('cancelling the "place under" step returns to the normal picker without creating anything', async () => {
    const user = userEvent.setup();
    const onCreateCategory = vi.fn();
    render(<MultiItemExpenseForm categoryGroups={GROUPS} onCreateCategory={onCreateCategory} />);

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));

    await user.click(screen.getByText('Cancel'));

    expect(onCreateCategory).not.toHaveBeenCalled();
    expect(screen.getByText('Select category…')).toBeInTheDocument();
    expect(useTransactionFormStore.getState().items[0].categoryId).toBe('');
  });

  it('creating a nested item on row 1, then independently creating a different nested item on row 2, works for both', async () => {
    const user = userEvent.setup();
    const onCreateCategory = vi.fn().mockResolvedValueOnce('new-egg-id').mockResolvedValueOnce('new-milk-id');
    const { container } = render(
      <MultiItemExpenseForm categoryGroups={GROUPS} onCreateCategory={onCreateCategory} />,
    );

    // Row 1: create "egg" under the existing "Meat" subcategory, then give it an amount
    // so auto-advance appends row 2.
    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));
    await user.click(screen.getByText('Search category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Meat');
    await user.click(await screen.findByText('Meat'));
    await user.type(screen.getByLabelText('Amount for item 1'), '60');

    expect(useTransactionFormStore.getState().items).toHaveLength(2);
    expect(useTransactionFormStore.getState().items[0].categoryId).toBe('new-egg-id');

    // Row 2: independently create "milk" under "Grocery" — this must not be blocked or
    // interfered with by row 1's already-completed create flow. Scoped to the actual
    // second row DOM node rather than text-matching "Select category…", since row 1's
    // resolved id ("new-egg-id") isn't a real option in this test's static GROUPS
    // fixture (a real app would refetch and recognize it), so CategoryPicker falls back
    // to showing the same placeholder text on row 1 too — text matching alone would
    // land on the wrong row.
    const rows = container.querySelectorAll('.multi-item-form__row');
    expect(rows).toHaveLength(2);
    const row2 = within(rows[1] as HTMLElement);

    await user.click(row2.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'milk');
    await user.click(await screen.findByText('Create "milk"'));
    expect(screen.getByText('Place "milk" under…')).toBeInTheDocument();

    await user.click(screen.getByText('Search category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Grocery');
    // "Grocery" also appears as the breadcrumb text on the unrelated "Meat" option
    // (parentLabel="Grocery"), so match the option whose own name starts with it.
    await user.click(await screen.findByRole('option', { name: /^Grocery/i }));

    expect(onCreateCategory).toHaveBeenNthCalledWith(1, 'egg', 'l2-meat');
    expect(onCreateCategory).toHaveBeenNthCalledWith(2, 'milk', 'l1-grocery');
    expect(useTransactionFormStore.getState().items[1].categoryId).toBe('new-milk-id');
    // Row 1's category must be untouched by row 2's independent create flow.
    expect(useTransactionFormStore.getState().items[0].categoryId).toBe('new-egg-id');
  });

  it('shows the real category name immediately after creating it, not the "Select category…" placeholder', async () => {
    // categoryGroups in this test never gets updated with the new id (a real app would
    // refetch it from the server, which takes at least one round trip) — so this proves
    // the picker recognizes freshly-created categories without depending on that refetch.
    const user = userEvent.setup();
    const onCreateCategory = vi.fn().mockResolvedValue('new-egg-id');
    render(<MultiItemExpenseForm categoryGroups={GROUPS} onCreateCategory={onCreateCategory} />);

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));
    await user.click(screen.getByText('Search category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Meat');
    await user.click(await screen.findByText('Meat'));

    expect(screen.getByText('egg')).toBeInTheDocument();
    expect(screen.queryByText('Select category…')).not.toBeInTheDocument();
  });

  it('a category created in row 1 is immediately searchable and selectable from row 2, without waiting on categoryGroups to refetch', async () => {
    const user = userEvent.setup();
    const onCreateCategory = vi.fn().mockResolvedValue('new-egg-id');
    const { container } = render(
      <MultiItemExpenseForm categoryGroups={GROUPS} onCreateCategory={onCreateCategory} />,
    );

    await user.click(screen.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    await user.click(await screen.findByText('Create "egg"'));
    await user.click(screen.getByText('Search category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'Meat');
    await user.click(await screen.findByText('Meat'));
    await user.type(screen.getByLabelText('Amount for item 1'), '60');

    const rows = container.querySelectorAll('.multi-item-form__row');
    expect(rows).toHaveLength(2);
    const row2 = within(rows[1] as HTMLElement);

    await user.click(row2.getByText('Select category…'));
    await user.type(screen.getByPlaceholderText('Search categories…'), 'egg');
    // Row 1's trigger now also reads "egg" (that's the fix working) — scope to the
    // dropdown option specifically rather than matching either instance of the text.
    await user.click(await screen.findByRole('option', { name: /^egg/i }));

    expect(useTransactionFormStore.getState().items[1].categoryId).toBe('new-egg-id');
  });
});
