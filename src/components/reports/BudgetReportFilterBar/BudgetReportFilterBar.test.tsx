import { useFormOptions } from '@/components/common/TransactionDialog/hooks/useFormOptions';
import type { ReportFilters } from '@/hooks/useReportFilters';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BudgetReportFilterBar } from './BudgetReportFilterBar';

vi.mock('@/components/common/TransactionDialog/hooks/useFormOptions', () => ({
  useFormOptions: vi.fn(),
}));

const mockedUseFormOptions = vi.mocked(useFormOptions);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function mockFormOptions() {
  mockedUseFormOptions.mockReturnValue({
    sources: [{ id: 'acc1', name: 'HDFC Savings', type: 'BANK_SAVINGS', currentBalance: 0 }],
    categories: [],
    categoryGroups: [],
    reportCategories: [
      { id: 'cat1', label: 'Groceries', depth: 1, type: 'EXPENSE', parentId: null },
    ],
    sinkingFunds: [],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof useFormOptions>);
}

const FILTERS: ReportFilters = {
  year: 2026,
  month: 7,
  type: 'all',
  accountId: 'all',
  categoryIds: [],
};

describe('BudgetReportFilterBar', () => {
  it('renders the month label, account/category/type controls, and reset/export actions', () => {
    mockFormOptions();
    render(
      <BudgetReportFilterBar
        filters={FILTERS}
        monthLabel="July 2026"
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onFilterChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    expect(screen.getByText('July 2026')).toBeInTheDocument();
    expect(screen.getByLabelText('Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Transaction type')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /export/i })).toBeDisabled();
  });

  it('calls onPrev/onNext from the month nav arrows', async () => {
    mockFormOptions();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const user = userEvent.setup();
    render(
      <BudgetReportFilterBar
        filters={FILTERS}
        monthLabel="July 2026"
        onPrev={onPrev}
        onNext={onNext}
        onFilterChange={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText('Previous month'));
    await user.click(screen.getByLabelText('Next month'));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('reports a type change immediately — no separate apply step', async () => {
    mockFormOptions();
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    render(
      <BudgetReportFilterBar
        filters={FILTERS}
        monthLabel="July 2026"
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onFilterChange={onFilterChange}
        onReset={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Transaction type'), 'EXPENSE');
    expect(onFilterChange).toHaveBeenCalledWith({ type: 'EXPENSE' });
  });

  it('reports an account change immediately', async () => {
    mockFormOptions();
    const onFilterChange = vi.fn();
    const user = userEvent.setup();
    render(
      <BudgetReportFilterBar
        filters={FILTERS}
        monthLabel="July 2026"
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onFilterChange={onFilterChange}
        onReset={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Account'), 'acc1');
    expect(onFilterChange).toHaveBeenCalledWith({ accountId: 'acc1' });
  });

  it('calls onReset when Reset is clicked', async () => {
    mockFormOptions();
    const onReset = vi.fn();
    const user = userEvent.setup();
    render(
      <BudgetReportFilterBar
        filters={FILTERS}
        monthLabel="July 2026"
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onFilterChange={vi.fn()}
        onReset={onReset}
      />,
    );

    await user.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
