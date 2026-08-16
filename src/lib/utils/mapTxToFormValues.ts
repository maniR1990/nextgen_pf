import type { TransactionFormValues } from '@/store/transactionFormStore';

// Map the API GET /transactions/:id response → form prefill values, shared by every
// edit entry point (the day-to-day Transactions page, the Project Ledger tab).
export function mapTxToFormValues(tx: Record<string, unknown>): Partial<TransactionFormValues> {
  const dateStr = typeof tx.date === 'string' ? tx.date.split('T')[0] : '';
  const account = tx.account as { id?: string } | null | undefined;
  const category = tx.category as { id?: string } | null | undefined;
  const toAccount = tx.toAccount as { id?: string } | null | undefined;

  return {
    type: (tx.type as TransactionFormValues['type']) ?? 'EXPENSE',
    date: dateStr,
    amount: tx.amount != null ? String(tx.amount) : '',
    merchant: (tx.merchant as string) ?? '',
    categoryId: category?.id ?? '',
    sourceId: account?.id ?? '',
    toAccountId: toAccount?.id ?? '',
    method: (tx.paymentMethod as string) ?? 'UPI',
    isPlanned: (tx.isPlanned as boolean) ?? true,
    isRecurring: (tx.isRecurring as boolean) ?? false,
    notes: (tx.notes as string) ?? '',
    tags: Array.isArray(tx.tags) ? (tx.tags as string[]).join(', ') : '',
    budgetPeriodYear: (tx.budgetPeriodYear as number) ?? new Date().getFullYear(),
    budgetPeriodMonth: (tx.budgetPeriodMonth as number) ?? new Date().getMonth() + 1,
    assetClass: (tx.assetClass as string) ?? '',
    fundName: (tx.fundName as string) ?? '',
    units: tx.units != null ? String(tx.units) : '',
    nav: tx.nav != null ? String(tx.nav) : '',
    mfPlan: (tx.mfPlan as string) ?? '',
    taxSection: (tx.taxSection as string) ?? '',
    incomeType: (tx.incomeType as string) ?? '',
    tds: tx.tds != null ? String(tx.tds) : '',
    giftFrom: (tx.giftFrom as string) ?? '',
    occasion: (tx.occasion as string) ?? '',
    fundId: (tx.fundId as string) ?? '',
    isTaxDed: (tx.isTaxDed as boolean) ?? false,
    isReimbursable: (tx.isReimbursable as boolean) ?? false,
    reimbDate: (tx.reimbDate as string) ?? '',
    reimbFrom: (tx.reimbFrom as string) ?? '',
    origTxRef: (tx.origTxRef as string) ?? '',
    txPurpose: (tx.txPurpose as string) ?? '',
    txFee: tx.txFee != null ? String(tx.txFee) : '',
    atmLocation: (tx.atmLocation as string) ?? '',
    atmPurpose: (tx.atmPurpose as string) ?? '',
    refundReason: (tx.refundReason as string) ?? '',
    origPrice: tx.origPrice != null ? String(tx.origPrice) : '',
    couponCode: (tx.couponCode as string) ?? '',
    platform: (tx.platform as string) ?? '',
    ptsSpent: tx.ptsSpent != null ? String(tx.ptsSpent) : '',
    ptsRate: tx.ptsRate != null ? String(tx.ptsRate) : '',
  };
}
