import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BudgetGroup } from '@/modules/budget-engine/budget-engine.types';
import { PaymentSchedulePanel } from './PaymentSchedulePanel';

const mockCreateMutateAsync = vi.fn().mockResolvedValue({ id: 'newTx1' });
const mockVoidMutateAsync = vi.fn().mockResolvedValue(undefined);
const mockUpdatePlanMutateAsync = vi.fn().mockResolvedValue({});

vi.mock('@/hooks/useTransactions', () => ({
  useCreateTransaction: () => ({ mutateAsync: mockCreateMutateAsync, isPending: false }),
  useVoidTransaction: () => ({ mutateAsync: mockVoidMutateAsync, isPending: false }),
}));

vi.mock('@/hooks/useBudgetSummary', () => ({
  useUpdateBudgetPlan: () => ({ mutateAsync: mockUpdatePlanMutateAsync, isPending: false }),
}));

vi.mock('@/components/common/ToastProvider/useToast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }),
}));

vi.mock('@/lib/query/fetcher', () => ({
  apiGetV1: vi.fn().mockResolvedValue([
    { id: 'acc1', name: 'HDFC Bank', type: 'BANK_SAVINGS', balance: 50000 },
  ]),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function makeGroups(overrides: Partial<Record<string, unknown>> = {}): BudgetGroup[] {
  return [
    {
      id: 'group1',
      name: 'Expenses',
      type: 'EXPENSE',
      planned: 6000,
      actual: 0,
      lastMonthActual: 0,
      variance: 0,
      variancePct: 0,
      progressPct: 0,
      categories: [
        {
          id: 'cat1',
          name: 'Parents Health Insurance',
          level: 1,
          icon: null,
          color: null,
          isSystem: false,
          isRecurring: true,
          isUnplanned: false,
          dueDay: 6,
          isSettled: false,
          settledTransactionId: null,
          planned: 6000,
          actual: 0,
          lastMonthActual: 0,
          variance: -6000,
          variancePct: -100,
          progressPct: 0,
          children: [],
          ...overrides,
        },
      ],
    },
  ];
}

function renderPanel(groups: BudgetGroup[], todayDay = 7) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PaymentSchedulePanel
        groups={groups}
        monthLabel="Jul 2026"
        year={2026}
        month={7}
        todayDay={todayDay}
        headless
      />
    </QueryClientProvider>,
  );
}

describe('PaymentSchedulePanel — settlement', () => {
  it('shows an unsettled item as overdue with a Pay action', async () => {
    renderPanel(makeGroups());
    expect(await screen.findByText('Parents Health Insurance')).toBeInTheDocument();
    // Scoped to the row badge specifically — the timeline legend also renders "Overdue".
    expect(screen.getByText('1d overdue')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pay parents health insurance/i })).toBeInTheDocument();
  });

  it('renders a settled item as Paid, with Undo instead of Pay', async () => {
    const { container } = renderPanel(makeGroups({ isSettled: true, settledTransactionId: 'tx1' }));
    expect(await screen.findByText('Parents Health Insurance')).toBeInTheDocument();
    // Scoped to the row badge specifically — the timeline legend also renders "Paid".
    expect(container.querySelector('.psp__row-badge--paid')).toHaveTextContent('Paid');
    expect(
      screen.getByRole('button', { name: /undo payment for parents health insurance/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /pay parents health insurance/i }),
    ).not.toBeInTheDocument();
  });

  it('manual "mark as paid" settles without logging a transaction', async () => {
    const user = userEvent.setup();
    renderPanel(makeGroups());

    await user.click(screen.getByRole('button', { name: /pay parents health insurance/i }));
    const markPaidBtn = await screen.findByRole('button', {
      name: /already paid this.*don't log a transaction/i,
    });
    await user.click(markPaidBtn);

    await waitFor(() =>
      expect(mockUpdatePlanMutateAsync).toHaveBeenCalledWith({
        categoryId: 'cat1',
        data: { settled: true },
      }),
    );
    // No transaction should be created for a pure manual settlement.
    expect(mockCreateMutateAsync).not.toHaveBeenCalled();
  });

  it('undoing a settled item unsettles the plan and voids the linked transaction', async () => {
    const user = userEvent.setup();
    renderPanel(makeGroups({ isSettled: true, settledTransactionId: 'tx1' }));

    await user.click(
      await screen.findByRole('button', { name: /undo payment for parents health insurance/i }),
    );

    await waitFor(() =>
      expect(mockUpdatePlanMutateAsync).toHaveBeenCalledWith({
        categoryId: 'cat1',
        data: { settled: false },
      }),
    );
    await waitFor(() => expect(mockVoidMutateAsync).toHaveBeenCalledWith('tx1'));
  });

  it('undoing a manually-settled item (no linked transaction) unsettles without voiding anything', async () => {
    const user = userEvent.setup();
    renderPanel(makeGroups({ isSettled: true, settledTransactionId: null }));

    await user.click(
      await screen.findByRole('button', { name: /undo payment for parents health insurance/i }),
    );

    await waitFor(() =>
      expect(mockUpdatePlanMutateAsync).toHaveBeenCalledWith({
        categoryId: 'cat1',
        data: { settled: false },
      }),
    );
    expect(mockVoidMutateAsync).not.toHaveBeenCalled();
  });

  it('Quick Pay (Expense) logs a transaction and settles the plan linked to it', async () => {
    const user = userEvent.setup();
    renderPanel(makeGroups());

    await user.click(screen.getByRole('button', { name: /pay parents health insurance/i }));
    const payBtn = await screen.findByRole('button', { name: /^pay ₹/i });
    await user.click(payBtn);

    await waitFor(() => expect(mockCreateMutateAsync).toHaveBeenCalledOnce());
    const createdTx = mockCreateMutateAsync.mock.calls[0]![0];
    expect(createdTx.type).toBe('EXPENSE');
    expect(createdTx.categoryId).toBe('cat1');

    await waitFor(() =>
      expect(mockUpdatePlanMutateAsync).toHaveBeenCalledWith({
        categoryId: 'cat1',
        data: { settled: true, settledTransactionId: 'newTx1' },
      }),
    );
  });
});
