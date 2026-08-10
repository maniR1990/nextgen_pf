import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { useTransactionFormStore } from '@/store/transactionFormStore';
import type { TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption, SinkingFundOption } from '@/types/finance';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InvestmentForm } from './InvestmentForm';

afterEach(() => {
  cleanup();
  act(() => useTransactionFormStore.getState().reset());
});

function makeValues(overrides: Partial<TransactionFormValues> = {}): TransactionFormValues {
  return {
    type: 'INVESTMENT',
    date: '2026-07-07',
    amount: '10000',
    merchant: '',
    categoryId: '',
    sourceId: 'bank1',
    toAccountId: '',
    method: 'UPI',
    isPlanned: true,
    isRecurring: false,
    notes: '',
    tags: '',
    budgetPeriodYear: 2026,
    budgetPeriodMonth: 7,
    assetClass: '',
    fundName: '',
    units: '',
    nav: '',
    mfPlan: '',
    taxSection: '',
    incomeType: '',
    tds: '',
    giftFrom: '',
    occasion: '',
    fundId: '',
    fundFlow: '',
    isTaxDed: false,
    isReimbursable: false,
    reimbDate: '',
    reimbFrom: '',
    origTxRef: '',
    txPurpose: '',
    txFee: '',
    atmLocation: '',
    atmPurpose: '',
    refundReason: '',
    origPrice: '',
    couponCode: '',
    platform: '',
    ptsSpent: '',
    ptsRate: '',
    recFrequency: 'monthly',
    recEvery: '1',
    recEndCondition: 'forever',
    recCount: '',
    recEndDate: '',
    ...overrides,
  };
}

const SOURCES: PaymentSourceOption[] = [
  { id: 'bank1', name: 'HDFC Bank', type: 'BANK_SAVINGS', balance: 50000 },
  { id: 'demat1', name: 'Zerodha Coin', type: 'INV_MF_EQUITY', balance: 20000 },
  { id: 'ppf1', name: 'PPF Account', type: 'INV_PPF', balance: 100000 },
];

const CATEGORY_GROUPS: PickerGroup[] = [
  {
    id: 'g-investment',
    name: 'Investments',
    type: 'INVESTMENT',
    children: [
      {
        id: 'l1-mf',
        name: 'Mutual Funds',
        isLeaf: false,
        children: [{ id: 'l2-elss', name: 'ELSS', isLeaf: true, children: [] }],
      },
    ],
  },
];

const SINKING_FUNDS: SinkingFundOption[] = [
  { id: 'fund1', label: 'Emergency Fund', target: 100000, saved: 40000, monthly: 5000 },
  { id: 'fund2', label: 'Vacation', target: 50000, saved: 10000, monthly: 2000 },
];

function renderForm(valueOverrides: Partial<TransactionFormValues> = {}) {
  const onChange = vi.fn();
  render(
    <InvestmentForm
      values={makeValues(valueOverrides)}
      errors={{}}
      onChange={onChange}
      paymentSources={SOURCES}
      categoryGroups={CATEGORY_GROUPS}
      sinkingFunds={SINKING_FUNDS}
    />,
  );
  return { onChange };
}

async function openMoreDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /more details/i }));
}

describe('InvestmentForm — destination toggle', () => {
  it('renders both destination options', () => {
    renderForm();
    expect(screen.getByRole('radio', { name: /investment account/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /sinking fund/i })).toBeInTheDocument();
  });

  it('defaults to Investment account checked when type is INVESTMENT', () => {
    renderForm({ type: 'INVESTMENT' });
    expect(screen.getByRole('radio', { name: /investment account/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('radio', { name: /sinking fund/i })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('shows Sinking fund checked when type is SINKING_DEPOSIT', () => {
    renderForm({ type: 'SINKING_DEPOSIT' });
    expect(screen.getByRole('radio', { name: /sinking fund/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('switching to Sinking fund sets type but keeps categoryId and toAccountId — both are shared fields now', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({
      type: 'INVESTMENT',
      categoryId: 'l2-elss',
      toAccountId: 'demat1',
    });

    await user.click(screen.getByRole('radio', { name: /sinking fund/i }));

    expect(onChange).toHaveBeenCalledWith('type', 'SINKING_DEPOSIT');
    expect(onChange).not.toHaveBeenCalledWith('categoryId', expect.anything());
    expect(onChange).not.toHaveBeenCalledWith('toAccountId', expect.anything());
  });

  it('switching to Investment account sets type and clears fundId', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({ type: 'SINKING_DEPOSIT', fundId: 'fund1' });

    await user.click(screen.getByRole('radio', { name: /investment account/i }));

    expect(onChange).toHaveBeenCalledWith('type', 'INVESTMENT');
    expect(onChange).toHaveBeenCalledWith('fundId', '');
  });

  it('clicking the already-active destination is a no-op', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({ type: 'INVESTMENT' });

    await user.click(screen.getByRole('radio', { name: /investment account/i }));

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('InvestmentForm — Investment account destination', () => {
  it('renders a category picker', () => {
    renderForm({ type: 'INVESTMENT' });
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('renders the "Invested Into" destination account field without needing to expand anything', () => {
    renderForm({ type: 'INVESTMENT' });
    expect(screen.getByText('Invested Into')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /invested into/i })).toHaveTextContent(
      'Select investment account (optional)',
    );
  });

  it('excludes the current source account from the destination options', async () => {
    const user = userEvent.setup();
    renderForm({ type: 'INVESTMENT', sourceId: 'bank1' });

    await user.click(screen.getByRole('combobox', { name: /invested into/i }));
    expect(screen.getByRole('option', { name: 'Zerodha Coin' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'PPF Account' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'HDFC Bank' })).not.toBeInTheDocument();
  });

  it('calls onChange with toAccountId when a destination account is picked', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({ type: 'INVESTMENT', sourceId: 'bank1' });

    await user.click(screen.getByRole('combobox', { name: /invested into/i }));
    await user.click(screen.getByRole('option', { name: 'Zerodha Coin' }));

    expect(onChange).toHaveBeenCalledWith('toAccountId', 'demat1');
  });

  it('does not require a destination account — no error when toAccountId is empty', () => {
    renderForm({ type: 'INVESTMENT', toAccountId: '' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not render the goal-tracking block', () => {
    renderForm({ type: 'INVESTMENT' });
    expect(screen.queryByText(/track toward a goal/i)).not.toBeInTheDocument();
  });

  it('still renders Tags and Notes once "More details" is expanded', async () => {
    const user = userEvent.setup();
    renderForm({ type: 'INVESTMENT' });
    await openMoreDetails(user);

    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });
});

describe('InvestmentForm — Sinking fund destination', () => {
  it('renders a category picker — sinking deposits are categorizable too, same as Investment', () => {
    renderForm({ type: 'SINKING_DEPOSIT' });
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('keeps the category selection when switching from Investment to Sinking', () => {
    renderForm({ type: 'SINKING_DEPOSIT', categoryId: 'l2-elss' });
    expect(screen.getByText('ELSS')).toBeInTheDocument();
  });

  it('renders "Deposit Into" as a required account field, not "Invested Into"', () => {
    renderForm({ type: 'SINKING_DEPOSIT' });
    expect(screen.queryByText('Invested Into')).not.toBeInTheDocument();
    expect(screen.getByText('Deposit Into')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /deposit into/i })).toHaveTextContent(
      'Select account',
    );
  });

  it('excludes the current source account from the Deposit Into options', async () => {
    const user = userEvent.setup();
    renderForm({ type: 'SINKING_DEPOSIT', sourceId: 'bank1' });

    await user.click(screen.getByRole('combobox', { name: /deposit into/i }));
    expect(screen.getByRole('option', { name: 'Zerodha Coin' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'HDFC Bank' })).not.toBeInTheDocument();
  });

  it('calls onChange with toAccountId when a deposit account is picked', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({ type: 'SINKING_DEPOSIT', sourceId: 'bank1' });

    await user.click(screen.getByRole('combobox', { name: /deposit into/i }));
    await user.click(screen.getByRole('option', { name: 'Zerodha Coin' }));

    expect(onChange).toHaveBeenCalledWith('toAccountId', 'demat1');
  });

  it('surfaces a required-field error on Deposit Into when toAccountId is missing', () => {
    const onChange = vi.fn();
    render(
      <InvestmentForm
        values={makeValues({ type: 'SINKING_DEPOSIT' })}
        errors={{ toAccountId: 'Destination account is required' }}
        onChange={onChange}
        paymentSources={SOURCES}
        categoryGroups={CATEGORY_GROUPS}
        sinkingFunds={SINKING_FUNDS}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Destination account is required');
  });

  it('shows the optional goal-tracking picker, not required', () => {
    renderForm({ type: 'SINKING_DEPOSIT' });
    expect(screen.getByText(/track toward a goal/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /track toward a goal/i })).toHaveTextContent(
      'No goal tracking',
    );
  });

  it('lists every sinking fund with its progress toward target', async () => {
    const user = userEvent.setup();
    renderForm({ type: 'SINKING_DEPOSIT' });

    await user.click(screen.getByRole('combobox', { name: /track toward a goal/i }));
    expect(screen.getByRole('option', { name: /emergency fund \(40% of ₹1,00,000\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /vacation \(20% of ₹50,000\)/i })).toBeInTheDocument();
  });

  it('calls onChange with fundId when a fund is picked', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({ type: 'SINKING_DEPOSIT' });

    await user.click(screen.getByRole('combobox', { name: /track toward a goal/i }));
    await user.click(screen.getByRole('option', { name: /emergency fund/i }));

    expect(onChange).toHaveBeenCalledWith('fundId', 'fund1');
  });

  it('shows Saved/Target/Monthly once a fund is selected', () => {
    renderForm({ type: 'SINKING_DEPOSIT', fundId: 'fund1' });

    expect(screen.getByText('Saved: ₹40,000')).toBeInTheDocument();
    expect(screen.getByText('Target: ₹1,00,000')).toBeInTheDocument();
    expect(screen.getByText('Monthly goal: ₹5,000')).toBeInTheDocument();
  });

  it('shows a "create one" empty state instead of the picker when no sinking funds exist', () => {
    const onChange = vi.fn();
    render(
      <InvestmentForm
        values={makeValues({ type: 'SINKING_DEPOSIT' })}
        errors={{}}
        onChange={onChange}
        paymentSources={SOURCES}
        categoryGroups={CATEGORY_GROUPS}
        sinkingFunds={[]}
      />,
    );
    expect(screen.queryByRole('combobox', { name: /track toward a goal/i })).not.toBeInTheDocument();
    expect(screen.getByText(/no sinking funds yet/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute(
      'href',
      '/dashboard/sinking-funds',
    );
  });
});

describe('InvestmentForm — Split into items (Sinking only)', () => {
  it('does not show the toggle for Investment account destination', () => {
    renderForm({ type: 'INVESTMENT' });
    expect(screen.queryByText('Split into items')).not.toBeInTheDocument();
  });

  it('shows the toggle for Sinking fund destination', () => {
    renderForm({ type: 'SINKING_DEPOSIT' });
    expect(screen.getByText('Split into items')).toBeInTheDocument();
  });

  it('swaps the single Category picker for MultiItemExpenseForm once toggled on', async () => {
    const user = userEvent.setup();
    renderForm({ type: 'SINKING_DEPOSIT' });

    await user.click(screen.getByRole('checkbox', { name: /split into items/i }));

    expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /invested into/i })).not.toBeInTheDocument();
  });

  it('still shows Deposit Into as a single shared field while split into items', async () => {
    const user = userEvent.setup();
    renderForm({ type: 'SINKING_DEPOSIT' });

    await user.click(screen.getByRole('checkbox', { name: /split into items/i }));

    expect(screen.getByText('Deposit Into')).toBeInTheDocument();
  });

  it('clears split-into-items mode when switching destination to Investment account', async () => {
    const user = userEvent.setup();
    renderForm({ type: 'SINKING_DEPOSIT' });

    await user.click(screen.getByRole('checkbox', { name: /split into items/i }));
    expect(useTransactionFormStore.getState().isMultiItem).toBe(true);

    await user.click(screen.getByRole('radio', { name: /investment account/i }));
    expect(useTransactionFormStore.getState().isMultiItem).toBe(false);
  });
});
