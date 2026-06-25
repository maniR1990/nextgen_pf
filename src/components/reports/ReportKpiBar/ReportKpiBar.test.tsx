import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReportKpiData } from '@/hooks/useReportKpiData';
import { ReportKpiBarInner, ReportKpiBarSkeleton } from './ReportKpiBar';

expect.extend(toHaveNoViolations);

const mockData: ReportKpiData = {
  totalIncomeMinor: 22300000,      // ₹2,23,000
  incomeSourceLabel: 'Salary + Gift',
  expensesSpentMinor: 3546200,     // ₹35,462
  expensesBudgetMinor: 9318300,    // ₹93,183
  expensesPct: 38.1,
  expensesVariant: 'success',
  investedMinor: 10000000,         // ₹1,00,000
  investedLabel: '3 SIPs',
  budgetRemainingMinor: 5772100,   // ₹57,721
  daysLeft: 19,
  accountBalanceMinor: 12773800,   // ₹1,27,738
  balanceStatus: 'Healthy buffer',
  balanceVariant: 'success',
};

describe('ReportKpiBarInner', () => {
  afterEach(() => cleanup());

  it('renders all 5 KPI cells', () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(container.querySelectorAll('.report-kpi-strip__cell')).toHaveLength(5);
  });

  it('shows Total Income label and formatted INR value in green', () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(container.querySelector('.report-kpi-strip__value--income')).toHaveTextContent(/₹2,23,000/);
  });

  it('shows income source as a success chip', () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    const chip = container.querySelector('.chip--success');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('Salary + Gift');
  });

  it('shows Expenses Spent label with budget reference and percentage badge', () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Expenses Spent')).toBeInTheDocument();
    expect(screen.getByText(/38\.1%/)).toBeInTheDocument();
    expect(container.querySelector('.badge--success')).toBeInTheDocument();
  });

  it('applies warning badge when expenses exceed 80% of budget', () => {
    const { container } = render(
      <ReportKpiBarInner data={{ ...mockData, expensesVariant: 'warning', expensesPct: 85 }} />,
    );
    expect(container.querySelector('.badge--warning')).toBeInTheDocument();
    expect(screen.getByText(/85%/)).toBeInTheDocument();
  });

  it('applies error badge when expenses exceed budget', () => {
    const { container } = render(
      <ReportKpiBarInner data={{ ...mockData, expensesVariant: 'error', expensesPct: 105 }} />,
    );
    expect(container.querySelector('.badge--error')).toBeInTheDocument();
  });

  it('shows Invested label and investedLabel chip', () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Invested')).toBeInTheDocument();
    expect(container.querySelector('.report-kpi-strip__value--money')).toBeInTheDocument();
    expect(screen.getByText('3 SIPs')).toBeInTheDocument();
  });

  it('shows Budget Remaining with days left text', () => {
    render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Budget Remaining')).toBeInTheDocument();
    expect(screen.getByText(/19 days left/)).toBeInTheDocument();
  });

  it('shows 0 days left for past periods', () => {
    render(<ReportKpiBarInner data={{ ...mockData, daysLeft: 0 }} />);
    expect(screen.getByText(/period closed/i)).toBeInTheDocument();
  });

  it('shows Account Balance with status chip', () => {
    render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Account Balance')).toBeInTheDocument();
    expect(screen.getByText('Healthy buffer')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('ReportKpiBarSkeleton', () => {
  afterEach(() => cleanup());

  it('renders 5 skeleton cells', () => {
    const { container } = render(<ReportKpiBarSkeleton />);
    expect(container.querySelectorAll('.report-kpi-strip__cell')).toHaveLength(5);
  });

  it('marks the container as aria-busy', () => {
    const { container } = render(<ReportKpiBarSkeleton />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders skeleton shimmer elements inside cells', () => {
    const { container } = render(<ReportKpiBarSkeleton />);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThanOrEqual(5);
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ReportKpiBarSkeleton />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('ReportKpiBar (with hook)', () => {
  afterEach(() => cleanup());

  it('renders skeleton while loading', async () => {
    vi.mock('@/hooks/useReportKpiData', () => ({
      useReportKpiData: () => ({ data: undefined, isLoading: true, isError: false }),
    }));
    const { ReportKpiBar } = await import('./ReportKpiBar');
    const { container } = render(<ReportKpiBar year={2026} month={6} />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    vi.resetModules();
  });

  it('renders inner component when data resolves', async () => {
    vi.mock('@/hooks/useReportKpiData', () => ({
      useReportKpiData: () => ({ data: mockData, isLoading: false, isError: false }),
    }));
    const { ReportKpiBar } = await import('./ReportKpiBar');
    render(<ReportKpiBar year={2026} month={6} />);
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    vi.resetModules();
  });
});
