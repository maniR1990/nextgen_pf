import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CashflowReport } from './CashflowReport';
import type { CashflowReportData } from '@/modules/reports/cashflow-report.types';

const mockReport: CashflowReportData = {
  year: 2026,
  month: 6,
  totalIncome: 100000,
  incomeSourceLabel: 'Salary',
  totalSavings: 25000,
  savingsBreakdown: [
    { fundGroupId: 'fg1', fundGroupName: 'Emergency', fundGroupColor: '#ef4444', totalAmount: 15000, pct: 15 },
    { fundGroupId: 'fg2', fundGroupName: 'Wealth', fundGroupColor: '#22c55e', totalAmount: 10000, pct: 10 },
  ],
  totalFundUsed: 0,
  fundUsed: [],
  expensesTotal: 30000,
  expensesPct: 30,
  remaining: 45000,
  remainingPct: 45,
  savingsPct: 25,
  denominator: 100000,
};

describe('CashflowReport', () => {
  it('renders Income section with formatted amount', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText(/1,00,000/)).toBeInTheDocument();
  });

  it('renders income source label', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.getByText('Salary')).toBeInTheDocument();
  });

  it('renders Savings section heading', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.getByText(/savings/i)).toBeInTheDocument();
  });

  it('renders each fund group in savings breakdown', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.getByText('Emergency')).toBeInTheDocument();
    expect(screen.getByText('Wealth')).toBeInTheDocument();
  });

  it('does NOT render Fund Used section when fundUsed is empty', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.queryByText(/fund used/i)).not.toBeInTheDocument();
  });

  it('renders Fund Used section when OUT transactions exist', () => {
    const withWithdrawal: CashflowReportData = {
      ...mockReport,
      totalFundUsed: 20000,
      fundUsed: [
        { fundGroupId: 'fg1', fundGroupName: 'Emergency', fundGroupColor: '#ef4444', totalAmount: 20000, pct: null },
      ],
    };
    render(<CashflowReport data={withWithdrawal} onMonthChange={vi.fn()} />);
    expect(screen.getByText(/fund used/i)).toBeInTheDocument();
  });

  it('renders Expenses section with percentage', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText(/30%/)).toBeInTheDocument();
  });

  it('renders Remaining amount', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.getByText('Remaining')).toBeInTheDocument();
    expect(screen.getByText(/45,000/)).toBeInTheDocument();
  });

  it('shows month and year in heading', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.getByText(/june 2026/i)).toBeInTheDocument();
  });

  it('fires onMonthChange with previous month when prev clicked', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<CashflowReport data={mockReport} onMonthChange={onMonthChange} />);

    await user.click(screen.getByRole('button', { name: /previous month/i }));

    expect(onMonthChange).toHaveBeenCalledWith(2026, 5);
  });

  it('fires onMonthChange with next month when next clicked', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(<CashflowReport data={mockReport} onMonthChange={onMonthChange} />);

    await user.click(screen.getByRole('button', { name: /next month/i }));

    expect(onMonthChange).toHaveBeenCalledWith(2026, 7);
  });

  it('wraps from January to December of previous year on prev', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(
      <CashflowReport data={{ ...mockReport, year: 2026, month: 1 }} onMonthChange={onMonthChange} />,
    );

    await user.click(screen.getByRole('button', { name: /previous month/i }));

    expect(onMonthChange).toHaveBeenCalledWith(2025, 12);
  });

  it('wraps from December to January of next year on next', async () => {
    const user = userEvent.setup();
    const onMonthChange = vi.fn();
    render(
      <CashflowReport data={{ ...mockReport, year: 2026, month: 12 }} onMonthChange={onMonthChange} />,
    );

    await user.click(screen.getByRole('button', { name: /next month/i }));

    expect(onMonthChange).toHaveBeenCalledWith(2027, 1);
  });

  it('suppresses all percentages when denominator is zero', () => {
    const emptyMonth: CashflowReportData = {
      ...mockReport,
      totalIncome: 0,
      totalFundUsed: 0,
      totalSavings: 0,
      savingsBreakdown: [],
      expensesTotal: 0,
      expensesPct: null,
      remaining: 0,
      remainingPct: null,
      savingsPct: null,
      denominator: 0,
    };
    render(<CashflowReport data={emptyMonth} onMonthChange={vi.fn()} />);
    expect(screen.queryAllByText(/%/)).toHaveLength(0);
  });

  it('shows savings percentage of total income', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    expect(screen.getByText(/25%/)).toBeInTheDocument();
  });

  it('renders four sections in order: Income, Savings, Expenses, Remaining', () => {
    render(<CashflowReport data={mockReport} onMonthChange={vi.fn()} />);
    const sections = screen.getAllByRole('region');
    const labels = sections.map((s) => s.getAttribute('aria-label') ?? s.textContent ?? '');
    const hasOrder = (a: string, b: string) =>
      labels.findIndex((l) => l.toLowerCase().includes(a)) <
      labels.findIndex((l) => l.toLowerCase().includes(b));
    expect(hasOrder('income', 'savings')).toBe(true);
    expect(hasOrder('savings', 'expense')).toBe(true);
    expect(hasOrder('expense', 'remaining')).toBe(true);
  });
});
