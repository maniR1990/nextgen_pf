import type { TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption, SinkingFundOption } from '@/types/finance';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TransferForm } from './TransferForm';

afterEach(() => cleanup());

function makeValues(overrides: Partial<TransactionFormValues> = {}): TransactionFormValues {
  return {
    type: 'TRANSFER',
    date: '2026-07-10',
    amount: '500',
    merchant: '',
    categoryId: '',
    sourceId: 'bank1',
    toAccountId: '',
    method: 'NEFT',
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
  { id: 'bank1', name: 'Salary Account', type: 'BANK_SAVINGS', balance: 50000 },
  { id: 'coin1', name: 'Coin App', type: 'INV_MF_EQUITY', balance: 20000 },
];

const FUNDS: SinkingFundOption[] = [
  { id: 'fund1', label: 'Insurance sinking fund', target: 6000, saved: 3000, monthly: 500 },
];

function renderForm(valueOverrides: Partial<TransactionFormValues> = {}, funds = FUNDS) {
  const onChange = vi.fn();
  render(
    <TransferForm
      values={makeValues(valueOverrides)}
      errors={{}}
      onChange={onChange}
      paymentSources={SOURCES}
      sinkingFunds={funds}
    />,
  );
  return { onChange };
}

async function expandMoreDetails() {
  await userEvent.click(screen.getByRole('button', { name: /more details/i }));
}

describe('TransferForm — fund purpose tag', () => {
  it('renders a Fund picker with the passed-in funds as options', async () => {
    renderForm();
    await expandMoreDetails();
    await userEvent.click(screen.getByRole('combobox', { name: /fund/i }));
    expect(screen.getByRole('option', { name: 'Insurance sinking fund' })).toBeInTheDocument();
  });

  it('does not show the direction toggle when no fund is selected', async () => {
    renderForm();
    await expandMoreDetails();
    expect(screen.queryByLabelText('Direction')).not.toBeInTheDocument();
  });

  it('shows the direction toggle once a fund is selected', async () => {
    renderForm({ fundId: 'fund1' });
    await expandMoreDetails();
    expect(screen.getByLabelText('Direction')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Add to fund' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Draw from fund' })).toBeInTheDocument();
  });

  it('calls onChange with fundId when a fund is picked', async () => {
    const { onChange } = renderForm();
    await expandMoreDetails();
    await userEvent.click(screen.getByRole('combobox', { name: /fund/i }));
    await userEvent.click(screen.getByRole('option', { name: 'Insurance sinking fund' }));
    expect(onChange).toHaveBeenCalledWith('fundId', 'fund1');
  });

  it('calls onChange with fundFlow when direction is changed', async () => {
    const { onChange } = renderForm({ fundId: 'fund1' });
    await expandMoreDetails();
    await userEvent.selectOptions(screen.getByLabelText('Direction'), 'OUT');
    expect(onChange).toHaveBeenCalledWith('fundFlow', 'OUT');
  });
});
