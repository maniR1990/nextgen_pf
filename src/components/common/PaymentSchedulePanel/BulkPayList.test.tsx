import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BulkPayList } from './BulkPayList';
import type { DuePaymentItem } from './derivePayments';

let txCounter = 0;
const mockCreateMutateAsync = vi.fn().mockImplementation(() => {
  txCounter += 1;
  return Promise.resolve({ id: `tx${txCounter}` });
});
const mockUpdatePlanMutateAsync = vi.fn().mockResolvedValue({});
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('@/hooks/useTransactions', () => ({
  useCreateTransaction: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useBudgetSummary', () => ({
  useUpdateBudgetPlan: () => ({
    mutateAsync: mockUpdatePlanMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/components/common/ToastProvider/useToast', () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
  txCounter = 0;
});

function makeItem(overrides: Partial<DuePaymentItem> & { id: string }): DuePaymentItem {
  return {
    name: overrides.id,
    amount: 1000,
    dueDay: 10,
    paid: false,
    isSettled: false,
    settledTransactionId: null,
    partial: false,
    remaining: overrides.amount ?? 1000,
    color: null,
    icon: null,
    groupType: 'EXPENSE',
    ...overrides,
  };
}

const sources = [
  { id: 'acc1', name: 'HDFC Savings', type: 'BANK_SAVINGS', balance: 50000 },
  { id: 'acc2', name: 'ICICI Card', type: 'CREDIT_CARD', balance: 0 },
];

const items = [
  makeItem({ id: 'claude', name: 'Claude', amount: 2345, dueDay: 5 }),
  makeItem({ id: 'internet', name: 'Internet', amount: 1000, dueDay: 10 }),
  makeItem({
    id: 'midcap',
    name: 'HDFC Mid Cap',
    amount: 5000,
    dueDay: 7,
    groupType: 'INVESTMENT',
  }),
  makeItem({
    id: 'salary',
    name: 'Salary',
    amount: 90000,
    dueDay: 1,
    groupType: 'INCOME',
  }),
  makeItem({
    id: 'mobile',
    name: 'Mobile',
    amount: 608,
    dueDay: 10,
    paid: true,
    isSettled: true,
  }),
];

function renderList(onDone = vi.fn()) {
  render(
    <BulkPayList
      items={items}
      sources={sources}
      year={2026}
      month={10}
      todayDay={6}
      isFutureMonth={false}
      onDone={onDone}
    />,
  );
  return { onDone };
}

describe('BulkPayList', () => {
  it('lists only unpaid, payable bills (no income, no already-paid)', () => {
    renderList();
    expect(screen.getByRole('checkbox', { name: /claude/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /internet/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /hdfc mid cap/i })).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /salary/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /mobile/i })).not.toBeInTheDocument();
  });

  it('starts with nothing selected', () => {
    renderList();
    for (const cb of screen.getAllByRole('checkbox')) expect(cb).not.toBeChecked();
    expect(screen.getByRole('button', { name: /select bills to log/i })).toBeInTheDocument();
  });

  it('shows the selected count and total on the log button', async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole('checkbox', { name: /claude/i }));
    await user.click(screen.getByRole('checkbox', { name: /internet/i }));
    expect(screen.getByRole('button', { name: /log 2 selected · ₹3,345/i })).toBeInTheDocument();
  });

  it('select all ticks every listed bill', async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole('button', { name: /select all/i }));
    for (const cb of screen.getAllByRole('checkbox')) expect(cb).toBeChecked();
  });

  it('does nothing when logging with no selection', async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole('button', { name: /select bills to log/i }));
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('logs each selected bill with its own account and amount, then settles it', async () => {
    const user = userEvent.setup();
    const { onDone } = renderList();

    await user.click(screen.getByRole('checkbox', { name: /internet/i }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: /account for internet/i }),
      'acc2',
    );
    const amt = screen.getByRole('spinbutton', {
      name: /amount for internet/i,
    });
    fireEvent.change(amt, { target: { value: '1040' } });

    await user.click(screen.getByRole('checkbox', { name: /hdfc mid cap/i }));

    await user.click(screen.getByRole('button', { name: /log 2 selected/i }));

    await waitFor(() => expect(mockUpdatePlanMutateAsync).toHaveBeenCalledTimes(2));
    expect(mockCreateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'EXPENSE',
        categoryId: 'internet',
        paymentSourceId: 'acc2',
        amount: 1040,
        budgetPeriodYear: 2026,
        budgetPeriodMonth: 10,
      }),
    );
    expect(mockCreateMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'INVESTMENT',
        categoryId: 'midcap',
        paymentSourceId: 'acc1',
      }),
    );
    expect(mockUpdatePlanMutateAsync).toHaveBeenCalledWith({
      categoryId: 'internet',
      data: {
        settled: true,
        settledTransactionId: expect.stringMatching(/^tx\d$/),
      },
    });
    expect(mockToastSuccess).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
  });

  it('defaults each bill to the account it was last paid from', () => {
    localStorage.setItem('psp-last-source', JSON.stringify({ internet: 'acc2' }));
    renderList();
    expect(screen.getByRole('combobox', { name: /account for internet/i })).toHaveValue('acc2');
    expect(screen.getByRole('combobox', { name: /account for claude/i })).toHaveValue('acc1');
  });

  it('reports failures and keeps failed bills selected for a retry', async () => {
    mockCreateMutateAsync
      .mockImplementationOnce(() => Promise.resolve({ id: 'txA' }))
      .mockImplementationOnce(() => Promise.reject(new Error('boom')));
    const user = userEvent.setup();
    const { onDone } = renderList();

    await user.click(screen.getByRole('checkbox', { name: /claude/i }));
    await user.click(screen.getByRole('checkbox', { name: /internet/i }));
    await user.click(screen.getByRole('button', { name: /log 2 selected/i }));

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(mockUpdatePlanMutateAsync).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: /internet/i })).toBeChecked();
  });
});
