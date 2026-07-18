import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InvestmentForm } from './InvestmentForm';

afterEach(() => cleanup());

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

function renderForm(valueOverrides: Partial<TransactionFormValues> = {}) {
  const onChange = vi.fn();
  render(
    <InvestmentForm
      values={makeValues(valueOverrides)}
      errors={{}}
      onChange={onChange}
      paymentSources={SOURCES}
      categoryGroups={CATEGORY_GROUPS}
    />,
  );
  return { onChange };
}

async function openMoreDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /more details/i }));
}

describe('InvestmentForm', () => {
  it('renders a category picker', () => {
    renderForm();
    expect(screen.getByText('Category')).toBeInTheDocument();
  });

  it('keeps "Invested Into" and its optional fields collapsed by default', () => {
    renderForm();
    expect(screen.queryByText('Invested Into')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more details/i })).toBeInTheDocument();
  });

  it('renders the "Invested Into" destination account field, unselected, once expanded', async () => {
    const user = userEvent.setup();
    renderForm();
    await openMoreDetails(user);

    expect(screen.getByText('Invested Into')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /invested into/i }),
    ).toHaveTextContent('Select investment account (optional)');
  });

  it('excludes the current source account from the destination options', async () => {
    const user = userEvent.setup();
    renderForm({ sourceId: 'bank1' });
    await openMoreDetails(user);

    await user.click(screen.getByRole('combobox', { name: /invested into/i }));
    expect(screen.getByRole('option', { name: 'Zerodha Coin' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'PPF Account' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'HDFC Bank' })).not.toBeInTheDocument();
  });

  it('calls onChange with toAccountId when a destination account is picked', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({ sourceId: 'bank1' });
    await openMoreDetails(user);

    await user.click(screen.getByRole('combobox', { name: /invested into/i }));
    await user.click(screen.getByRole('option', { name: 'Zerodha Coin' }));

    expect(onChange).toHaveBeenCalledWith('toAccountId', 'demat1');
  });

  it('does not require a destination account — no error when toAccountId is empty', async () => {
    const user = userEvent.setup();
    renderForm({ toAccountId: '' });
    await openMoreDetails(user);
    // The field renders without an error state; FormField only shows role="alert" on error.
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('still renders Tags and Notes once expanded (unchanged from before)', async () => {
    const user = userEvent.setup();
    renderForm();
    await openMoreDetails(user);

    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });
});
