import type { BudgetFlagsResult } from '@/hooks/useBudgetFlags';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ReportBudgetAlertsInner } from './ReportBudgetAlerts';

afterEach(() => cleanup());

const EMPTY: BudgetFlagsResult = {
  unplannedTotal: 0,
  unplanned: [],
  overBudgetTotal: 0,
  overBudget: [],
};

describe('ReportBudgetAlertsInner', () => {
  it('renders nothing when there is no unplanned spend and nothing is over budget', () => {
    const { container } = render(<ReportBudgetAlertsInner data={EMPTY} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists unplanned categories with their total', () => {
    render(
      <ReportBudgetAlertsInner
        data={{
          ...EMPTY,
          unplannedTotal: 4800,
          unplanned: [
            { id: 'c1', name: 'Gadget', parentName: null, amount: 3000 },
            { id: 'c2', name: 'Haircut', parentName: 'Personal Care', amount: 1800 },
          ],
        }}
      />,
    );

    expect(screen.getByText('Unplanned spend')).toBeInTheDocument();
    expect(screen.getByText('₹4,800')).toBeInTheDocument();
    expect(screen.getByText('Gadget')).toBeInTheDocument();
    expect(screen.getByText('Personal Care › Haircut')).toBeInTheDocument();
    expect(screen.getByText('₹3,000')).toBeInTheDocument();
    expect(screen.getByText('₹1,800')).toBeInTheDocument();
  });

  it('lists over-budget categories with how much over, not the raw spend', () => {
    render(
      <ReportBudgetAlertsInner
        data={{
          ...EMPTY,
          overBudgetTotal: 2500,
          overBudget: [
            { id: 'c1', name: 'Groceries', parentName: null, amount: 6200, planned: 5000, over: 1200 },
            { id: 'c2', name: 'Haircut', parentName: 'Personal Care', amount: 1800, planned: 500, over: 1300 },
          ],
        }}
      />,
    );

    expect(screen.getByText('Over budget')).toBeInTheDocument();
    expect(screen.getByText('+₹2,500')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    // Over-by, not the raw ₹6,200 actual spend.
    expect(screen.getByText('+₹1,200')).toBeInTheDocument();
    expect(screen.getByText('+₹1,300')).toBeInTheDocument();
    expect(screen.queryByText('₹6,200')).not.toBeInTheDocument();
  });

  it('renders both groups together when both apply', () => {
    render(
      <ReportBudgetAlertsInner
        data={{
          unplannedTotal: 3000,
          unplanned: [{ id: 'c1', name: 'Gadget', parentName: null, amount: 3000 }],
          overBudgetTotal: 1200,
          overBudget: [
            { id: 'c2', name: 'Groceries', parentName: null, amount: 6200, planned: 5000, over: 1200 },
          ],
        }}
      />,
    );

    expect(screen.getByText('Unplanned spend')).toBeInTheDocument();
    expect(screen.getByText('Over budget')).toBeInTheDocument();
  });

  it('shows only the unplanned group when nothing is over budget', () => {
    render(
      <ReportBudgetAlertsInner
        data={{
          ...EMPTY,
          unplannedTotal: 3000,
          unplanned: [{ id: 'c1', name: 'Gadget', parentName: null, amount: 3000 }],
        }}
      />,
    );

    expect(screen.getByText('Unplanned spend')).toBeInTheDocument();
    expect(screen.queryByText('Over budget')).not.toBeInTheDocument();
  });
});
