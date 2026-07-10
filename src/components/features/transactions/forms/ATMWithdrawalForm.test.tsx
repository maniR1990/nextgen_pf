import type { TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ATMWithdrawalForm } from './ATMWithdrawalForm';

afterEach(() => cleanup());

function makeValues(overrides: Partial<TransactionFormValues> = {}): TransactionFormValues {
  return {
    type: 'ATM_WITHDRAWAL',
    date: '2026-07-10',
    amount: '1000',
    merchant: '',
    categoryId: '',
    sourceId: 'bank1',
    toAccountId: '',
    method: 'ATM',
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
    sfId: '',
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
  { id: 'cash1', name: 'Cash In Hand', type: 'CASH_ATM', balance: 2000 },
  { id: 'demat1', name: 'Zerodha Coin', type: 'INV_MF_EQUITY', balance: 20000 },
];

function renderForm(valueOverrides: Partial<TransactionFormValues> = {}, sources = SOURCES) {
  const onChange = vi.fn();
  render(
    <ATMWithdrawalForm
      values={makeValues(valueOverrides)}
      errors={{}}
      onChange={onChange}
      paymentSources={sources}
    />,
  );
  return { onChange };
}

describe('ATMWithdrawalForm', () => {
  it('renders a required "To Account" destination field', () => {
    renderForm();
    expect(screen.getByText('To Account')).toBeInTheDocument();
  });

  it('excludes the current source account from the destination options', async () => {
    const user = userEvent.setup();
    renderForm({ sourceId: 'bank1' });

    await user.click(screen.getByRole('combobox', { name: /to account/i }));
    expect(screen.getByRole('option', { name: 'Cash In Hand' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Zerodha Coin' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'HDFC Bank' })).not.toBeInTheDocument();
  });

  it('calls onChange with toAccountId when a destination account is picked', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm({ sourceId: 'bank1', toAccountId: 'demat1' });

    await user.click(screen.getByRole('combobox', { name: /to account/i }));
    await user.click(screen.getByRole('option', { name: 'Cash In Hand' }));

    expect(onChange).toHaveBeenCalledWith('toAccountId', 'cash1');
  });

  it('auto-selects the user\'s cash account on first render when none is set', () => {
    const { onChange } = renderForm({ toAccountId: '' });
    expect(onChange).toHaveBeenCalledWith('toAccountId', 'cash1');
  });

  it('does not override an already-selected destination account', () => {
    const { onChange } = renderForm({ toAccountId: 'demat1' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not auto-select when the user has no cash-type account', () => {
    const { onChange } = renderForm({ toAccountId: '' }, [
      { id: 'bank1', name: 'HDFC Bank', type: 'BANK_SAVINGS', balance: 50000 },
      { id: 'demat1', name: 'Zerodha Coin', type: 'INV_MF_EQUITY', balance: 20000 },
    ]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps ATM Location and Purpose collapsed behind "More details" by default', () => {
    renderForm();
    expect(screen.queryByLabelText('ATM Location')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Purpose')).not.toBeInTheDocument();
  });

  it('still renders ATM Location and Purpose fields once expanded', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /more details/i }));
    expect(screen.getByLabelText('ATM Location')).toBeInTheDocument();
    expect(screen.getByLabelText('Purpose')).toBeInTheDocument();
  });
});
