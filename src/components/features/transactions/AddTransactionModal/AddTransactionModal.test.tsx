import { useTransactionFormStore } from '@/store/transactionFormStore';
import type { PaymentSourceOption } from '@/types/finance';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddTransactionModal } from './AddTransactionModal';

vi.mock('@/components/common/ToastProvider/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock('@/lib/query/fetcher', () => ({
  apiPostV1: vi.fn().mockResolvedValue({ id: 'tx1' }),
  apiPatchV1: vi.fn().mockResolvedValue({ id: 'tx1' }),
  apiGetV1: vi.fn().mockResolvedValue({}),
}));

// The actual account/category/split-item fields aren't what this test is about — only
// whether the store ends up with the right `sourceId`. Stubbing every form type out
// keeps the test from dragging in CategoryPicker, MiniDateStrip, etc.
vi.mock('@/components/features/transactions/forms', () => {
  const Stub = () => null;
  return {
    CommonFormFields: Stub,
    ExpenseForm: Stub,
    MultiItemExpenseForm: Stub,
    InvestmentForm: Stub,
    SinkingDepositForm: Stub,
    IncomeForm: Stub,
    GiftReceivedForm: Stub,
    ReimbursementForm: Stub,
    TransferForm: Stub,
    ATMWithdrawalForm: Stub,
    RefundForm: Stub,
    CouponUseForm: Stub,
    PointsRedeemForm: Stub,
  };
});

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

const PAYMENT_SOURCES: PaymentSourceOption[] = [
  { id: 'acc-first-alphabetically', name: 'Ainion', type: 'BANK_SAVINGS', balance: 0 },
  { id: 'acc-actually-used', name: 'Zerodha', type: 'BROKERAGE', balance: 0 },
];

afterEach(() => cleanup());

describe('AddTransactionModal — editing an existing transaction', () => {
  beforeEach(() => {
    act(() => useTransactionFormStore.getState().reset());
  });

  it("prefills the transaction's own account, not paymentSources[0]", async () => {
    // Regression: an unguarded "default the account once options load" effect used to
    // run in the same commit as the prefill effect and read the store's sourceId
    // *before* prefill's write was visible to it, so it always overwrote the correct
    // account with the first payment source — exactly the "always shows Ainion" bug.
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <AddTransactionModal
          open
          onClose={vi.fn()}
          paymentSources={PAYMENT_SOURCES}
          categories={[]}
          categoryGroups={[]}
          sinkingFunds={[]}
          editId="tx-1"
          prefillValues={{
            type: 'EXPENSE',
            sourceId: 'acc-actually-used',
            merchant: 'near by shop',
            amount: '92',
          }}
        />
      </Wrapper>,
    );

    expect(useTransactionFormStore.getState().values.sourceId).toBe('acc-actually-used');
  });

  it('still defaults to the first payment source when logging a brand-new transaction', () => {
    const Wrapper = makeWrapper();
    render(
      <Wrapper>
        <AddTransactionModal
          open
          onClose={vi.fn()}
          paymentSources={PAYMENT_SOURCES}
          categories={[]}
          categoryGroups={[]}
          sinkingFunds={[]}
        />
      </Wrapper>,
    );

    expect(useTransactionFormStore.getState().values.sourceId).toBe('acc-first-alphabetically');
  });
});
