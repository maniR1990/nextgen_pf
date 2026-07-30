import type { BudgetFlagsResult } from '@/hooks/useBudgetFlags';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    expect(screen.getByText('Excess Amount')).toBeInTheDocument();
    const row = screen.getByText('Vehicle Insurance').closest('tr')!;
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
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.queryByText('Excess Amount')).not.toBeInTheDocument();
    expect(screen.getByText('Gadget')).toBeInTheDocument();
    expect(screen.getByText('₹5,200.00')).toBeInTheDocument();
    // Vehicle Insurance was on the other tab — must not still be showing.
    expect(screen.queryByText('Vehicle Insurance')).not.toBeInTheDocument();
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
    expect(screen.getByText('Gadget')).toBeInTheDocument();
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

    expect(screen.getByText('₹1,465.00')).toHaveClass('budget-flags-table__excess');

    fireEvent.click(screen.getByRole('tab', { name: 'Unplanned Expenses' }));
    expect(screen.getByText('₹5,200.00')).toHaveClass('budget-flags-table__amount');
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

    const row = screen.getByText('—').closest('tr')!;
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

    const rows = screen.getAllByRole('row').slice(1); // drop header row
    expect(rows[0]).toHaveTextContent('Bathroom Cleaner');
    expect(rows[1]).toHaveTextContent('Doctor / Consultation');
  });
});
