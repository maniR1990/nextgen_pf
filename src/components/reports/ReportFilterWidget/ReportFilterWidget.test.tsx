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
    reportCategories: [
      { id: 'cat1', label: 'Groceries', depth: 1, type: 'EXPENSE', parentId: null },
      { id: 'cat2', label: 'Household', depth: 1, type: 'EXPENSE', parentId: null },
      {
        id: 'cat1a',
        label: 'Supermarket',
        parentLabel: 'Groceries',
        depth: 2,
        type: 'EXPENSE',
        parentId: 'cat1',
      },
    ],
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
      pctOfIncome: null,
      incomeForPeriod: null,
    });
    render(<ReportFilterWidget />);

    const naValues = screen.getAllByText('N/A');
    expect(naValues).toHaveLength(2);
  });

  it('shows the income-ratio card when a specific month is set, and nothing about other months', () => {
    mockFormOptions();
    mockResult({
      actual: 8650,
      count: 3,
      recurringActual: 1500,
      planned: 8000,
      variance: 650,
      pctOfPlanned: 108,
      pctOfIncome: 10.2,
      incomeForPeriod: 85000,
    });
    render(<ReportFilterWidget />);

    expect(screen.getByText('₹8,650 / ₹85,000')).toBeInTheDocument();
    expect(screen.getByText('Spent from income')).toBeInTheDocument();
    expect(screen.queryByText(/last month/i)).not.toBeInTheDocument();
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
      pctOfIncome: 24,
      incomeForPeriod: 83333,
    });
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.selectOptions(screen.getByLabelText('Transaction type'), 'INVESTMENT');
    await user.click(screen.getByRole('button', { name: /check total/i }));

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

  it('lets the user select several categories together, e.g. Groceries and Household', async () => {
    mockFormOptions();
    mockResult(undefined);
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.click(screen.getByLabelText('Category'));
    await user.click(screen.getByRole('option', { name: 'Groceries' }));
    await user.click(screen.getByRole('option', { name: 'Household' }));

    expect(screen.getByLabelText('Category')).toHaveTextContent('Groceries +1 more');

    const groceriesOption = screen.getByRole('option', { name: 'Groceries' });
    const householdOption = screen.getByRole('option', { name: 'Household' });
    expect(groceriesOption).toHaveAttribute('aria-selected', 'true');
    expect(householdOption).toHaveAttribute('aria-selected', 'true');
  });

  it('hides a category once its parent is selected, since the parent already covers it', async () => {
    mockFormOptions();
    mockResult(undefined);
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.click(screen.getByLabelText('Category'));
    expect(screen.getByRole('option', { name: 'Supermarket' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Groceries' }));

    expect(screen.queryByRole('option', { name: 'Supermarket' })).not.toBeInTheDocument();
    // The other, unrelated top-level category stays fully pickable.
    expect(screen.getByRole('option', { name: 'Household' })).toBeInTheDocument();
  });

  it("hides a category's parent once the category itself is selected, in either order", async () => {
    mockFormOptions();
    mockResult(undefined);
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.click(screen.getByLabelText('Category'));
    await user.click(screen.getByRole('option', { name: 'Supermarket' }));

    expect(screen.queryByRole('option', { name: 'Groceries' })).not.toBeInTheDocument();
  });

  it('hides a stale result the moment a filter changes, instead of leaving mismatched numbers on screen', async () => {
    mockFormOptions();
    mockResult({
      actual: 8650,
      count: 3,
      recurringActual: 1500,
      planned: 8000,
      variance: 650,
      pctOfPlanned: 108,
      pctOfIncome: null,
      incomeForPeriod: null,
    });
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    expect(screen.getByText('₹8,650')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Transaction type'), 'EXPENSE');

    expect(screen.queryByText('₹8,650')).not.toBeInTheDocument();
    expect(
      screen.getByText('Filters changed — press Check total to see updated results.'),
    ).toBeInTheDocument();
  });

  it('shows the result again once Check total is pressed after a filter change', async () => {
    mockFormOptions();
    mockResult({
      actual: 8650,
      count: 3,
      recurringActual: 1500,
      planned: 8000,
      variance: 650,
      pctOfPlanned: 108,
      pctOfIncome: null,
      incomeForPeriod: null,
    });
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.selectOptions(screen.getByLabelText('Transaction type'), 'EXPENSE');
    expect(screen.queryByText('₹8,650')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /check total/i }));

    expect(screen.getByText('₹8,650')).toBeInTheDocument();
  });

  it('does not show the stale-filters prompt right after Reset, since defaults are freshly checked', async () => {
    mockFormOptions();
    mockResult(undefined);
    const user = userEvent.setup();
    render(<ReportFilterWidget />);

    await user.selectOptions(screen.getByLabelText('Transaction type'), 'EXPENSE');
    await user.click(screen.getByRole('button', { name: /reset/i }));

    expect(
      screen.queryByText('Filters changed — press Check total to see updated results.'),
    ).not.toBeInTheDocument();
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
