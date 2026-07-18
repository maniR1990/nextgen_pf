import type { PickerGroup } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import type { TransactionFormValues } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExpenseForm } from './ExpenseForm';

afterEach(() => cleanup());

function makeValues(overrides: Partial<TransactionFormValues> = {}): TransactionFormValues {
  return {
    type: 'EXPENSE',
    date: '2026-07-10',
    amount: '450',
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
];

const CATEGORY_GROUPS: PickerGroup[] = [
  {
    id: 'g-expense',
    name: 'Expenses',
    type: 'EXPENSE',
    children: [{ id: 'l1-groceries', name: 'Groceries', isLeaf: true, children: [] }],
  },
];

function renderForm(valueOverrides: Partial<TransactionFormValues> = {}) {
  const onChange = vi.fn();
  const { container } = render(
    <ExpenseForm
      values={makeValues(valueOverrides)}
      errors={{}}
      onChange={onChange}
      paymentSources={SOURCES}
      categoryGroups={CATEGORY_GROUPS}
      budgetImpact={null}
      duplicate={null}
      onDismissDuplicate={vi.fn()}
    />,
  );
  return { onChange, container };
}

describe('ExpenseForm — field order', () => {
  it('puts Merchant / Description before Category', () => {
    const { container } = renderForm();
    const text = container.textContent ?? '';
    expect(text.indexOf('Merchant / Description')).toBeLessThan(text.indexOf('Category'));
  });

  it('calls onChange with merchant text as the user types', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm();
    await user.type(screen.getByPlaceholderText('e.g. BigBasket, Swiggy...'), 'B');
    expect(onChange).toHaveBeenCalledWith('merchant', 'B');
  });
});

describe('ExpenseForm — collapsed secondary fields', () => {
  it('hides tags and notes by default', () => {
    renderForm();
    expect(screen.queryByLabelText('Tags')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Notes')).not.toBeInTheDocument();
  });

  it('reveals tags and notes after opening "More details"', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByRole('button', { name: /more details/i }));
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('still calls onChange for tags once revealed', async () => {
    const user = userEvent.setup();
    const { onChange } = renderForm();
    await user.click(screen.getByRole('button', { name: /more details/i }));
    await user.type(screen.getByLabelText('Tags'), 'g');
    expect(onChange).toHaveBeenCalledWith('tags', 'g');
  });
});
