import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFormOptions } from '@/components/common/TransactionDialog/hooks/useFormOptions';
import { useReportFilter } from '@/hooks/useReportFilter';
import type { ReportFilterResult } from '@/hooks/useReportFilter';
import { ReportFilterWidget } from './ReportFilterWidget';

vi.mock('@/components/common/TransactionDialog/hooks/useFormOptions', () => ({
  useFormOptions: vi.fn(),
}));
vi.mock('@/hooks/useReportFilter', () => ({
  useReportFilter: vi.fn(),
}));

const mockedUseFormOptions = vi.mocked(useFormOptions);
const mockedUseReportFilter = vi.mocked(useReportFilter);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function mockFormOptions() {
  mockedUseFormOptions.mockReturnValue({
    sources: [{ id: 'acc1', name: 'HDFC Savings', type: 'BANK_SAVINGS', currentBalance: 0 }],
    categories: [{ id: 'cat1', label: 'Groceries', depth: 1, type: 'EXPENSE' }],
    categoryGroups: [],
    sinkingFunds: [],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useFormOptions>);
}

function mockResult(data: ReportFilterResult | undefined, opts: { isFetching?: boolean } = {}) {
  const refetch = vi.fn();
  mockedUseReportFilter.mockReturnValue({
    data,
    isFetching: opts.isFetching ?? false,
    isFetched: data !== undefined,
    refetch,
  } as unknown as ReturnType<typeof useReportFilter>);
  return refetch;
}

describe('ReportFilterWidget', () => {
  it('renders all four filters and the check button', () => {
    mockFormOptions();
    mockResult(undefined);
    render(<ReportFilterWidget />);

    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Transaction type')).toBeInTheDocument();
    expect(screen.getByLabelText('Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Month')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /check total/i })).toBeInTheDocument();
  });

  it('auto-checks once on mount', () => {
    mockFormOptions();
    const refetch = mockResult(undefined);
    render(<ReportFilterWidget />);

    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state when the result has zero matching items', () => {
    mockFormOptions();
    mockResult({
      actual: 0,
      count: 0,
      recurringActual: 0,
      planned: 0,
      variance: 0,
      pctOfPlanned: null,
      previousActual: null,
      previousChangePct: null,
      pctOfIncome: null,
      incomeForPeriod: null,
    });
    render(<ReportFilterWidget />);

    expect(screen.getByText('No transactions match these filters.')).toBeInTheDocument();
  });

  it('renders planned, actual, variance and the caption for a real result', () => {
    mockFormOptions();
    mockResult({
      actual: 8650,
      count: 3,
      recurringActual: 1500,
      planned: 8000,
      variance: 650,
      pctOfPlanned: 108,
      previousActual: null,
      previousChangePct: null,
      pctOfIncome: null,
      incomeForPeriod: null,
    });
    render(<ReportFilterWidget />);

    expect(screen.getByText('₹8,000')).toBeInTheDocument();
    expect(screen.getByText('₹8,650')).toBeInTheDocument();
    expect(screen.getByText('+₹650')).toBeInTheDocument();
    expect(screen.getByText('3 matching items · ₹1,500 recurring')).toBeInTheDocument();
  });

  it('shows N/A for planned/variance when the service returns null (account filter case)', () => {
    mockFormOptions();
    mockResult({
      actual: 4120,
      count: 2,
      recurringActual: 0,
      planned: null,
      variance: null,
      pctOfPlanned: null,
      previousActual: null,
      previousChangePct: null,
      pctOfIncome: null,
      incomeForPeriod: null,
    });
    render(<ReportFilterWidget />);

    const naValues = screen.getAllByText('N/A');
    expect(naValues).toHaveLength(2);
  });

  it('shows the vs-last-month trend and the income-ratio card when a specific month is set', () => {
    mockFormOptions();
    mockResult({
      actual: 8650,
      count: 3,
      recurringActual: 1500,
      planned: 8000,
      variance: 650,
      pctOfPlanned: 108,
      previousActual: 7000,
      previousChangePct: 23.6,
      pctOfIncome: 10.2,
      incomeForPeriod: 85000,
    });
    render(<ReportFilterWidget />);

    expect(screen.getByText('₹1,650 more than last month')).toBeInTheDocument();
    expect(screen.getByText('₹8,650 / ₹85,000')).toBeInTheDocument();
    expect(screen.getByText('Spent from income')).toBeInTheDocument();
  });

  it('labels the actual/ratio cards for Income and Investment differently than Expense', async () => {
    mockFormOptions();
    mockResult({
      actual: 20000,
      count: 1,
      recurringActual: 20000,
      planned: 20000,
      variance: 0,
      pctOfPlanned: 100,
      previousActual: 15000,
      previousChangePct: 33.3,
      pctOfIncome: 24,
      incomeForPeriod: 83333,
    });
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.selectOptions(screen.getByLabelText('Transaction type'), 'INVESTMENT');

    expect(screen.getByText('Actual invested')).toBeInTheDocument();
    expect(screen.getByText('Invested from income')).toBeInTheDocument();
  });

  it('starts with Reset disabled, and enables it once a filter changes', async () => {
    mockFormOptions();
    mockResult(undefined);
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    const resetBtn = screen.getByRole('button', { name: /reset/i });
    expect(resetBtn).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Transaction type'), 'EXPENSE');

    expect(resetBtn).toBeEnabled();
  });

  it('reset restores every filter to its default and re-checks', async () => {
    mockFormOptions();
    const refetch = mockResult(undefined);
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.selectOptions(screen.getByLabelText('Transaction type'), 'EXPENSE');
    await user.selectOptions(screen.getByLabelText('Account'), 'acc1');
    refetch.mockClear();

    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(screen.getByLabelText('Transaction type')).toHaveValue('all');
    expect(screen.getByLabelText('Account')).toHaveValue('all');
    await vi.waitFor(() => expect(refetch).toHaveBeenCalledTimes(1));
  });

  it('lets a selected category be cleared with its own X button, not just full Reset', async () => {
    mockFormOptions();
    mockResult(undefined);
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.click(screen.getByLabelText('Category'));
    await user.click(screen.getByRole('option', { name: 'Groceries' }));

    expect(screen.getByLabelText('Category')).toHaveTextContent('Groceries');

    await user.click(screen.getByRole('button', { name: /clear selection/i }));

    expect(screen.getByLabelText('Category')).toHaveTextContent('All categories');
  });

  it('lets the user search categories by typing, not just scroll a long list', async () => {
    mockFormOptions();
    mockResult(undefined);
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.click(screen.getByLabelText('Category'));

    expect(screen.getByPlaceholderText('Search categories…')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
  });
});
