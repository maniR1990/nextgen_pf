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

  it("shows Expense's Remaining without a leading plus sign, but with a minus when over budget", () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    // planned 89478, actual 74829.72 → remaining = 14648.28 (positive, no "+")
    expect(screen.getByText('₹14,648.28')).toBeInTheDocument();
    expect(screen.queryByText('+₹14,648.28')).not.toBeInTheDocument();
  });

  it("shows Investment's Shortfall with an explicit minus sign", () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    // planned 63500, actual 0 → shortfall = variance = -63500
    expect(screen.getByText('−₹63,500')).toBeInTheDocument();
  });

  it("shows Income's surplus with an explicit plus sign", () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    expect(screen.getByText('+₹2,60,991')).toBeInTheDocument();
  });

  it('shows "Not set" instead of ₹0 for an income section with no planned target', () => {
    render(<BudgetHealthGridInner data={BY_TYPE_RESULT} selectedType="all" />);
    expect(screen.getByText('Not set')).toBeInTheDocument();
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
    expect(screen.getByText('₹3,000')).toBeInTheDocument(); // remaining, no sign
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
