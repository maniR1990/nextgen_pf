import type { ReportKpiData } from '@/hooks/useReportKpiData';
import { cleanup, render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportKpiBarInner, ReportKpiBarSkeleton } from './ReportKpiBar';

expect.extend(toHaveNoViolations);

const mockData: ReportKpiData = {
  totalIncomeMinor: 22300000, // ₹2,23,000
  incomeSourceLabel: 'Salary + Gift',
  expensesSpentMinor: 3546200, // ₹35,462
  expensesBudgetMinor: 9318300, // ₹93,183
  expensesPct: 38.1,
  expensesVariant: 'success',
  investedMinor: 10000000, // ₹1,00,000
  investedLabel: '3 SIPs',
  budgetRemainingMinor: 5772100, // ₹57,721
  daysLeft: 19,
  accountBalanceMinor: 12773800, // ₹1,27,738
  balanceStatus: 'Healthy buffer',
  balanceVariant: 'success',
};

describe('ReportKpiBarInner', () => {
  afterEach(() => cleanup());

  it('renders exactly 4 KPI cells — no separate Budget Remaining card', () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(container.querySelectorAll('.report-kpi-strip__cell')).toHaveLength(4);
    expect(screen.queryByText('Budget Remaining')).not.toBeInTheDocument();
  });

  it('shows Total Income label, formatted INR value, and its income source as plain text', () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Total Income')).toBeInTheDocument();
    expect(container.querySelector('.report-kpi-strip__value--income')).toHaveTextContent(
      /₹2,23,000/,
    );
    expect(screen.getByText('Salary + Gift')).toBeInTheDocument();
  });

  it('shows Total Expenses with a plain "Burn rate: N%" subtitle, no badge', () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    expect(container.querySelector('.report-kpi-strip__value')).toBeInTheDocument();
    expect(screen.getByText('Burn rate: 38.1%')).toBeInTheDocument();
    expect(container.querySelector('.badge')).not.toBeInTheDocument();
  });

  it('shows Total Invested and its SIP label', () => {
    render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Total Invested')).toBeInTheDocument();
    expect(screen.getByText('3 SIPs')).toBeInTheDocument();
  });

  it('shows Available Balance with its status text', () => {
    render(<ReportKpiBarInner data={mockData} />);
    expect(screen.getByText('Available Balance')).toBeInTheDocument();
    expect(screen.getByText('Healthy buffer')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ReportKpiBarInner data={mockData} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('ReportKpiBarSkeleton', () => {
  afterEach(() => cleanup());

  it('renders 4 skeleton cells', () => {
    const { container } = render(<ReportKpiBarSkeleton />);
    expect(container.querySelectorAll('.report-kpi-strip__cell')).toHaveLength(4);
  });

  it('marks the container as aria-busy', () => {
    const { container } = render(<ReportKpiBarSkeleton />);
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
  });

  it('renders skeleton shimmer elements inside cells', () => {
    const { container } = render(<ReportKpiBarSkeleton />);
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThanOrEqual(4);
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
