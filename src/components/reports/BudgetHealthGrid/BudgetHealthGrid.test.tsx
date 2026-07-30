import type { ReportFilterResult } from '@/hooks/useReportFilter';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BudgetHealthGridInner } from './BudgetHealthGrid';

afterEach(() => cleanup());

const BY_TYPE_RESULT: ReportFilterResult = {
  count: 158,
  actual: null,
  recurringActual: null,
  planned: null,
  variance: null,
  pctOfPlanned: null,
  pctOfIncome: null,
  incomeForPeriod: 260991,
  byType: [
    { type: 'INCOME', actual: 260991, recurringActual: 0, count: 6, planned: 0, variance: 260991, pctOfIncome: 100 },
    {
      type: 'EXPENSE',
      actual: 74829.72,
      recurringActual: 8342.65,
      count: 151,
      planned: 89478,
      variance: -14648.28,
      pctOfIncome: 28.7,
    },
    { type: 'INVESTMENT', actual: 0, recurringActual: 0, count: 1, planned: 63500, variance: -63500, pctOfIncome: 0 },
  ],
};

describe('BudgetHealthGridInner', () => {
  it('renders one card per type with type-specific row labels', () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);

    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Planned Limit')).toBeInTheDocument();
    expect(screen.getByText('Actual Spent')).toBeInTheDocument();
    expect(screen.getByText('Remaining')).toBeInTheDocument();

    expect(screen.getByText('Investments')).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();
    expect(screen.getByText('Actual Invested')).toBeInTheDocument();
    expect(screen.getByText('Shortfall')).toBeInTheDocument();

    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Planned Target')).toBeInTheDocument();
    expect(screen.getByText('Actual Received')).toBeInTheDocument();
  });

  it("shows Expense's Remaining in green, without a leading plus sign, when there's budget left", () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    // planned 89478, actual 74829.72 → remaining = 14648.28 (positive = under budget = good)
    const remaining = screen.getByText('₹14,648.28');
    expect(remaining).toBeInTheDocument();
    expect(screen.queryByText('+₹14,648.28')).not.toBeInTheDocument();
    expect(remaining).toHaveStyle({ color: 'var(--color-success)' });
  });

  it('shows Expense Remaining in red once spend actually crosses the planned limit', () => {
    const overBudget: ReportFilterResult = {
      ...BY_TYPE_RESULT,
      byType: BY_TYPE_RESULT.byType!.map((b) =>
        b.type === 'EXPENSE' ? { ...b, actual: 95000, variance: 95000 - 89478 } : b,
      ),
    };
    render(<BudgetHealthGridInner data={overBudget} selectedType="all" />);
    // remaining = 89478 - 95000 = -5522 (negative = overspent = bad)
    const remaining = screen.getByText('−₹5,522.00');
    expect(remaining).toBeInTheDocument();
    expect(remaining).toHaveStyle({ color: 'var(--color-error)' });
  });

  it("shows Investment's Shortfall with an explicit minus sign, in red", () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    // planned 63500, actual 0 → shortfall = variance = -63500
    const shortfall = screen.getByText('−₹63,500.00');
    expect(shortfall).toBeInTheDocument();
    expect(shortfall).toHaveStyle({ color: 'var(--color-error)' });
  });

  it("shows Income's surplus with an explicit plus sign, in green", () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    const surplus = screen.getByText('+₹2,60,991.00');
    expect(surplus).toBeInTheDocument();
    expect(surplus).toHaveStyle({ color: 'var(--color-success)' });
  });

  it('always shows exactly 2 decimal places, even for whole-rupee amounts', () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    // Expense planned is a whole number (89478) but must render as 89,478.00
    expect(screen.getByText('₹89,478.00')).toBeInTheDocument();
    expect(screen.queryByText('₹89,478')).not.toBeInTheDocument();
  });

  it('shows "Not set" instead of ₹0 for an income section with no planned target', () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    expect(screen.getByText('Not set')).toBeInTheDocument();
  });

  describe('unplanned spend row', () => {
    it("shows Unplanned Spend on the Expenses card only, when the figure is provided", () => {
      render(
        <BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" unplannedSpend={5200} />,
      );

      expect(screen.getByText('Unplanned Spend')).toBeInTheDocument();
      expect(screen.getByText('₹5,200.00')).toBeInTheDocument();
      // Only one such row — not duplicated onto Income/Investment.
      expect(screen.getAllByText('Unplanned Spend')).toHaveLength(1);
    });

    it('omits the row entirely when no unplanned figure is supplied', () => {
      render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
      expect(screen.queryByText('Unplanned Spend')).not.toBeInTheDocument();
    });

    it('does not show the row on the single-card narrowed view, even for type=EXPENSE', () => {
      const singleResult: ReportFilterResult = {
        count: 42,
        actual: 12000,
        recurringActual: 0,
        planned: 15000,
        variance: -3000,
        pctOfPlanned: 80,
        pctOfIncome: null,
        incomeForPeriod: null,
        byType: null,
      };
      render(
        <BudgetHealthGridInner data={singleResult} selectedType="EXPENSE" unplannedSpend={5200} />,
      );
      expect(screen.queryByText('Unplanned Spend')).not.toBeInTheDocument();
    });
  });

  it('renders a single card, adopting the selected type\'s labels, once a type filter narrows the result', () => {
    const singleResult: ReportFilterResult = {
      count: 42,
      actual: 12000,
      recurringActual: 0,
      planned: 15000,
      variance: -3000,
      pctOfPlanned: 80,
      pctOfIncome: null,
      incomeForPeriod: null,
      byType: null,
    };
    render(<BudgetHealthGridInner data={singleResult} selectedType="EXPENSE" />);

    expect(screen.getAllByText('Expenses')).toHaveLength(1);
    expect(screen.getByText('Planned Limit')).toBeInTheDocument();
    expect(screen.getByText('₹3,000.00')).toBeInTheDocument(); // remaining, no sign
  });

  it('falls back to generic Planned/Actual/Variance labels for a category-only filter (type still "all")', () => {
    const singleResult: ReportFilterResult = {
      count: 10,
      actual: 5000,
      recurringActual: 0,
      planned: 4000,
      variance: 1000,
      pctOfPlanned: 125,
      pctOfIncome: null,
      incomeForPeriod: null,
      byType: null,
    };
    render(<BudgetHealthGridInner data={singleResult} selectedType="all" />);

    expect(screen.getByText('Selected filters')).toBeInTheDocument();
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getByText('Actual')).toBeInTheDocument();
    expect(screen.getByText('Variance')).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches the filters', () => {
    render(
      <BudgetHealthGridInner
        data={{
          count: 0,
          actual: null,
          recurringActual: null,
          planned: null,
          variance: null,
          pctOfPlanned: null,
          pctOfIncome: null,
          incomeForPeriod: null,
          byType: null,
        }}
        selectedType="all"
      />,
    );
    expect(screen.getByText(/no transactions match/i)).toBeInTheDocument();
  });
});
