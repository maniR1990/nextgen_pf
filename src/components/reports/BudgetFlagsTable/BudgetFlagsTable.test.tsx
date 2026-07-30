import type { BudgetFlagsResult } from '@/hooks/useBudgetFlags';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { BudgetFlagsTableInner } from './BudgetFlagsTable';

afterEach(() => cleanup());

const EMPTY: BudgetFlagsResult = {
  unplannedTotal: 0,
  unplanned: [],
  overBudgetTotal: 0,
  overBudget: [],
};

describe('BudgetFlagsTableInner', () => {
  it('renders nothing when nothing is over budget and nothing is unplanned', () => {
    const { container } = render(<BudgetFlagsTableInner data={EMPTY} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('defaults to the Over-Budget tab and shows Category / Item / Excess Amount', () => {
    render(
      <BudgetFlagsTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 1465,
          overBudget: [
            { id: 'c1', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
          ],
        }}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Over-Budget Breakdown' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const table = screen.getByRole('table');
    expect(within(table).getByText('Excess Amount')).toBeInTheDocument();
    const row = within(table).getByText('Vehicle Insurance').closest('tr')!;
    expect(row).toHaveTextContent('Insurance');
    expect(row).toHaveTextContent('₹1,465.00');
  });

  it('switches to the Unplanned tab on click and shows a plain "Amount" column', () => {
    render(
      <BudgetFlagsTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 1465,
          overBudget: [
            { id: 'c1', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
          ],
          unplannedTotal: 5200,
          unplanned: [{ id: 'u1', name: 'Gadget', parentName: null, amount: 5200 }],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Unplanned Expenses' }));

    expect(screen.getByRole('tab', { name: 'Unplanned Expenses' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const table = screen.getByRole('table');
    expect(within(table).getByText('Amount')).toBeInTheDocument();
    expect(within(table).queryByText('Excess Amount')).not.toBeInTheDocument();
    expect(within(table).getByText('Gadget')).toBeInTheDocument();
    expect(within(table).getByText('₹5,200.00')).toBeInTheDocument();
    // Vehicle Insurance was on the other tab — must not still be showing.
    expect(within(table).queryByText('Vehicle Insurance')).not.toBeInTheDocument();
  });

  it('lands on the Unplanned tab by default when only unplanned spend exists', () => {
    render(
      <BudgetFlagsTableInner
        data={{
          ...EMPTY,
          unplannedTotal: 3000,
          unplanned: [{ id: 'u1', name: 'Gadget', parentName: null, amount: 3000 }],
        }}
      />,
    );

    expect(screen.getByRole('tab', { name: 'Unplanned Expenses' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('table')).toHaveTextContent('Gadget');
  });

  it('shows an empty message on a tab with nothing to show, without losing the other tab', () => {
    render(
      <BudgetFlagsTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 1465,
          overBudget: [
            { id: 'c1', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
          ],
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Unplanned Expenses' }));
    expect(screen.getByText(/no unplanned spend this month/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Over-Budget Breakdown' })).toBeInTheDocument();
  });

  it('gives the over-budget amount cell a bold red class, and the unplanned amount cell a neutral one', () => {
    render(
      <BudgetFlagsTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 1465,
          overBudget: [
            { id: 'c1', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
          ],
          unplannedTotal: 5200,
          unplanned: [{ id: 'u1', name: 'Gadget', parentName: null, amount: 5200 }],
        }}
      />,
    );

    const table = screen.getByRole('table');
    expect(within(table).getByText('₹1,465.00')).toHaveClass('budget-flags-table__excess');

    fireEvent.click(screen.getByRole('tab', { name: 'Unplanned Expenses' }));
    expect(within(screen.getByRole('table')).getByText('₹5,200.00')).toHaveClass(
      'budget-flags-table__amount',
    );
  });

  it("falls back to an em dash for the subcategory column when a leaf has no parent", () => {
    render(
      <BudgetFlagsTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 1200,
          overBudget: [{ id: 'c1', name: 'Insurance', parentName: null, amount: 1200, planned: 0, over: 1200 }],
        }}
      />,
    );

    const table = screen.getByRole('table');
    const row = within(table).getByText('—').closest('tr')!;
    expect(row).toHaveTextContent('Insurance');
  });

  it('preserves the descending-by-amount order the service already returns', () => {
    render(
      <BudgetFlagsTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 8849.09,
          overBudget: [
            { id: 'c1', name: 'Bathroom Cleaner', parentName: 'Grocery', amount: 8849, planned: 1700, over: 7149.09 },
            { id: 'c2', name: 'Doctor / Consultation', parentName: 'Healthcare', amount: 2700, planned: 1000, over: 1700 },
          ],
        }}
      />,
    );

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1); // drop header row
    expect(rows[0]).toHaveTextContent('Bathroom Cleaner');
    expect(rows[1]).toHaveTextContent('Doctor / Consultation');
  });

  describe('mobile card list', () => {
    it('renders the same rows as stacked cards, for narrow viewports that hide the table', () => {
      render(
        <BudgetFlagsTableInner
          data={{
            ...EMPTY,
            overBudgetTotal: 1465,
            overBudget: [
              { id: 'c1', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
            ],
          }}
        />,
      );

      const list = screen.getByRole('list');
      const card = within(list).getByText('Vehicle Insurance').closest('li')!;
      expect(card).toHaveTextContent('Insurance');
      expect(card).toHaveTextContent('₹1,465.00');
    });

    it('switches tabs for the card list too', () => {
      render(
        <BudgetFlagsTableInner
          data={{
            ...EMPTY,
            overBudgetTotal: 1465,
            overBudget: [
              { id: 'c1', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
            ],
            unplannedTotal: 5200,
            unplanned: [{ id: 'u1', name: 'Gadget', parentName: null, amount: 5200 }],
          }}
        />,
      );

      fireEvent.click(screen.getByRole('tab', { name: 'Unplanned Expenses' }));

      const list = screen.getByRole('list');
      expect(within(list).getByText('Gadget')).toBeInTheDocument();
      expect(within(list).queryByText('Vehicle Insurance')).not.toBeInTheDocument();
    });
  });

  const MULTI_ROW_OVER_BUDGET: BudgetFlagsResult = {
    ...EMPTY,
    overBudgetTotal: 7149.09 + 1700 + 1465,
    overBudget: [
      { id: 'c1', name: 'Bathroom Cleaner', parentName: 'Grocery', amount: 8849, planned: 1700, over: 7149.09 },
      { id: 'c2', name: 'Doctor / Consultation', parentName: 'Healthcare', amount: 2700, planned: 1000, over: 1700 },
      { id: 'c3', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
    ],
  };

  describe('search', () => {
    it('filters rows by category or item, case-insensitively', async () => {
      const user = userEvent.setup();
      render(<BudgetFlagsTableInner data={MULTI_ROW_OVER_BUDGET} />);

      await user.type(screen.getByLabelText('Search category or item'), 'health');

      const table = screen.getByRole('table');
      expect(within(table).getByText('Doctor / Consultation')).toBeInTheDocument();
      expect(within(table).queryByText('Bathroom Cleaner')).not.toBeInTheDocument();
      expect(within(table).queryByText('Vehicle Insurance')).not.toBeInTheDocument();
    });

    it('shows a distinct "no matches" message from the true empty state', async () => {
      const user = userEvent.setup();
      render(<BudgetFlagsTableInner data={MULTI_ROW_OVER_BUDGET} />);

      await user.type(screen.getByLabelText('Search category or item'), 'zzz-nope');

      expect(screen.getByText('No matches for "zzz-nope".')).toBeInTheDocument();
      expect(screen.queryByText(/nothing is over budget/i)).not.toBeInTheDocument();
    });

    it('hides the search/sort controls entirely when a tab has no rows to search', () => {
      render(<BudgetFlagsTableInner data={MULTI_ROW_OVER_BUDGET} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Unplanned Expenses' }));

      expect(screen.queryByLabelText('Search category or item')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Sort')).not.toBeInTheDocument();
    });
  });

  describe('sort', () => {
    it('defaults to Amount: High to Low, matching the service\'s own default order', () => {
      render(<BudgetFlagsTableInner data={MULTI_ROW_OVER_BUDGET} />);
      expect(screen.getByLabelText('Sort')).toHaveValue('amount-desc');
    });

    it('re-sorts ascending by amount when selected', async () => {
      const user = userEvent.setup();
      render(<BudgetFlagsTableInner data={MULTI_ROW_OVER_BUDGET} />);

      await user.selectOptions(screen.getByLabelText('Sort'), 'amount-asc');

      const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      expect(rows[0]).toHaveTextContent('Vehicle Insurance');
      expect(rows[1]).toHaveTextContent('Doctor / Consultation');
      expect(rows[2]).toHaveTextContent('Bathroom Cleaner');
    });

    it('sorts alphabetically by category when selected', async () => {
      const user = userEvent.setup();
      render(<BudgetFlagsTableInner data={MULTI_ROW_OVER_BUDGET} />);

      await user.selectOptions(screen.getByLabelText('Sort'), 'category-asc');

      const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      expect(rows[0]).toHaveTextContent('Grocery');
      expect(rows[1]).toHaveTextContent('Healthcare');
      expect(rows[2]).toHaveTextContent('Insurance');
    });

    it('keeps the mobile card list in the same sorted order as the table', async () => {
      const user = userEvent.setup();
      render(<BudgetFlagsTableInner data={MULTI_ROW_OVER_BUDGET} />);

      await user.selectOptions(screen.getByLabelText('Sort'), 'amount-asc');

      const cards = within(screen.getByRole('list')).getAllByRole('listitem');
      expect(cards[0]).toHaveTextContent('Vehicle Insurance');
      expect(cards[2]).toHaveTextContent('Bathroom Cleaner');
    });
  });
});
