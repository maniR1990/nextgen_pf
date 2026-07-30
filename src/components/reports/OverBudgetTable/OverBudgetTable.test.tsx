import type { BudgetFlagsResult } from '@/hooks/useBudgetFlags';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { OverBudgetTableInner } from './OverBudgetTable';

afterEach(() => cleanup());

const EMPTY: BudgetFlagsResult = {
  unplannedTotal: 0,
  unplanned: [],
  overBudgetTotal: 0,
  overBudget: [],
};

describe('OverBudgetTableInner', () => {
  it('renders nothing when nothing is over budget', () => {
    const { container } = render(<OverBudgetTableInner data={EMPTY} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders Category, Item / Subcategory, and Excess Amount as separate columns', () => {
    render(
      <OverBudgetTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 2500,
          overBudget: [
            { id: 'c1', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
          ],
        }}
      />,
    );

    const row = screen.getByText('Vehicle Insurance').closest('tr')!;
    expect(row).toHaveTextContent('Insurance');
    expect(row).toHaveTextContent('Vehicle Insurance');
    expect(row).toHaveTextContent('₹1,465');
  });

  it("falls back to an em dash for the subcategory column when a leaf has no parent", () => {
    render(
      <OverBudgetTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 1200,
          overBudget: [
            { id: 'c1', name: 'Insurance', parentName: null, amount: 1200, planned: 0, over: 1200 },
          ],
        }}
      />,
    );

    const row = screen.getByText('—').closest('tr')!;
    expect(row).toHaveTextContent('Insurance');
  });

  it('shows the excess amount, not the raw spend', () => {
    render(
      <OverBudgetTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 1465,
          overBudget: [
            { id: 'c1', name: 'Vehicle Insurance', parentName: 'Insurance', amount: 1965, planned: 500, over: 1465 },
          ],
        }}
      />,
    );

    expect(screen.getByText('₹1,465')).toBeInTheDocument();
    expect(screen.queryByText('₹1,965')).not.toBeInTheDocument();
  });

  it('preserves the descending-by-excess order the service already returns', () => {
    render(
      <OverBudgetTableInner
        data={{
          ...EMPTY,
          overBudgetTotal: 3165,
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
