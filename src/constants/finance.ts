// Finance domain constants — mirrors Prisma enums + UI metadata

export const TX_TYPES = {
  EXPENSE: 'EXPENSE',
  INVESTMENT: 'INVESTMENT',
  SINKING_DEPOSIT: 'SINKING_DEPOSIT',
  INCOME: 'INCOME',
  GIFT_RECEIVED: 'GIFT_RECEIVED',
  REIMBURSEMENT: 'REIMBURSEMENT',
  TRANSFER: 'TRANSFER',
  ATM_WITHDRAWAL: 'ATM_WITHDRAWAL',
  REFUND: 'REFUND',
  COUPON_REDEMPTION: 'COUPON_REDEMPTION',
  POINTS_REDEMPTION: 'POINTS_REDEMPTION',
} as const;

export type TxType = (typeof TX_TYPES)[keyof typeof TX_TYPES];

export const TX_TYPE_GROUPS = {
  OUTFLOW: ['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT'],
  INFLOW: ['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT'],
  MOVEMENT: ['TRANSFER', 'ATM_WITHDRAWAL'],
  ADJUSTMENT: ['REFUND', 'COUPON_REDEMPTION', 'POINTS_REDEMPTION'],
} as const;

export interface TxTypeMeta {
  label: string;
  icon: string;
  description: string;
  group: keyof typeof TX_TYPE_GROUPS;
  amountSign: 'debit' | 'credit' | 'neutral';
  /** Whether this type has a payment method, can be marked unplanned, or can recur — single
   *  source of truth so the modal and every per-type form agree without duplicating the rule. */
  hasMethod: boolean;
  hasPlanned: boolean;
  hasRecurring: boolean;
}

export const TX_TYPE_META: Record<TxType, TxTypeMeta> = {
  EXPENSE: {
    label: 'Expense',
    icon: 'TrendingDown',
    description: 'Day-to-day spend',
    group: 'OUTFLOW',
    amountSign: 'debit',
    hasMethod: true,
    hasPlanned: true,
    hasRecurring: true,
  },
  INVESTMENT: {
    label: 'Investment',
    icon: 'TrendingUp',
    description: 'MF/stocks/FD/PPF/NPS/Gold/ELSS/Crypto',
    group: 'OUTFLOW',
    amountSign: 'debit',
    hasMethod: true,
    hasPlanned: false,
    hasRecurring: true,
  },
  SINKING_DEPOSIT: {
    label: 'Sinking',
    icon: 'PiggyBank',
    description: 'Contribution to a named goal fund',
    group: 'OUTFLOW',
    amountSign: 'debit',
    hasMethod: true,
    hasPlanned: false,
    hasRecurring: true,
  },
  INCOME: {
    label: 'Income',
    icon: 'ArrowUpRight',
    description: 'Salary, freelance, rental, interest',
    group: 'INFLOW',
    amountSign: 'credit',
    hasMethod: true,
    hasPlanned: false,
    hasRecurring: false,
  },
  GIFT_RECEIVED: {
    label: 'Gift Received',
    icon: 'Gift',
    description: 'Cash/voucher gifts',
    group: 'INFLOW',
    amountSign: 'credit',
    hasMethod: true,
    hasPlanned: false,
    hasRecurring: false,
  },
  REIMBURSEMENT: {
    label: 'Reimbursement',
    icon: 'Receipt',
    description: 'Office expense claims',
    group: 'INFLOW',
    amountSign: 'credit',
    hasMethod: true,
    hasPlanned: false,
    hasRecurring: false,
  },
  TRANSFER: {
    label: 'Transfer',
    icon: 'ArrowLeftRight',
    description: 'Internal fund moves between own accounts',
    group: 'MOVEMENT',
    amountSign: 'neutral',
    hasMethod: true,
    hasPlanned: false,
    hasRecurring: false,
  },
  ATM_WITHDRAWAL: {
    label: 'ATM Withdrawal',
    icon: 'Landmark',
    description: 'Cash pulled from ATM',
    group: 'MOVEMENT',
    amountSign: 'neutral',
    hasMethod: false,
    hasPlanned: false,
    hasRecurring: false,
  },
  REFUND: {
    label: 'Refund',
    icon: 'Undo2',
    description: 'Merchant credits back',
    group: 'ADJUSTMENT',
    amountSign: 'credit',
    hasMethod: true,
    hasPlanned: false,
    hasRecurring: false,
  },
  COUPON_REDEMPTION: {
    label: 'Coupon Use',
    icon: 'Tag',
    description: 'Discount applied at checkout',
    group: 'ADJUSTMENT',
    amountSign: 'neutral',
    hasMethod: true,
    hasPlanned: false,
    hasRecurring: false,
  },
  POINTS_REDEMPTION: {
    label: 'Points Redeem',
    icon: 'Star',
    description: 'Loyalty points used as payment',
    group: 'ADJUSTMENT',
    amountSign: 'neutral',
    hasMethod: false,
    hasPlanned: false,
    hasRecurring: false,
  },
};

export const PAYMENT_METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'NEFT', label: 'NEFT' },
  { value: 'IMPS', label: 'IMPS' },
  { value: 'RTGS', label: 'RTGS' },
  { value: 'CARD_SWIPE', label: 'Card Swipe' },
  { value: 'CARD_ONLINE', label: 'Card Online' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'AUTO_DEBIT', label: 'Auto Debit' },
  { value: 'ATM', label: 'ATM' },
  { value: 'GIFT_CARD', label: 'Gift Card' },
  { value: 'POINTS', label: 'Points' },
  { value: 'COUPON', label: 'Coupon' },
  { value: 'STORE_CREDIT', label: 'Store Credit' },
] as const;

export const ASSET_CLASSES = [
  { value: 'equity_mf', label: 'Equity MF' },
  { value: 'direct_stk', label: 'Direct Stock' },
  { value: 'fd', label: 'Fixed Deposit' },
  { value: 'ppf', label: 'PPF' },
  { value: 'nps', label: 'NPS' },
  { value: 'gold', label: 'Gold ETF' },
  { value: 'elss', label: 'ELSS' },
  { value: 'crypto', label: 'Crypto' },
] as const;

export const INCOME_TYPES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'rental', label: 'Rental' },
  { value: 'interest', label: 'Interest' },
  { value: 'dividend', label: 'Dividend' },
  { value: 'other', label: 'Other' },
] as const;

export const TAX_SECTIONS = [
  { value: '80C', label: '80C (ELSS/PPF/LIC)' },
  { value: '80CCC', label: '80CCC (Pension)' },
  { value: '80D', label: '80D (Health Insurance)' },
  { value: 'HRA', label: 'HRA (House Rent)' },
  { value: 'LTA', label: 'LTA (Leave Travel)' },
] as const;

export const REFUND_REASONS = [
  { value: 'return', label: 'Product Return' },
  { value: 'cancellation', label: 'Order Cancellation' },
  { value: 'overcharge', label: 'Overcharged' },
  { value: 'warranty', label: 'Warranty Claim' },
  { value: 'other', label: 'Other' },
] as const;

export const RECURRENCE_FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly', unit: 'month' },
  { value: 'TWICE_MONTHLY', label: 'Twice Monthly', unit: 'month' },
  { value: 'QUARTERLY', label: 'Quarterly', unit: 'quarter' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly', unit: 'half-year' },
  { value: 'ANNUAL', label: 'Yearly', unit: 'year' },
  { value: 'EVERY_2_MONTHS', label: 'Every 2 Months', unit: '2 months' },
] as const;

export const QUICK_AMOUNT_CHIPS = [
  { label: '100', value: 100 },
  { label: '500', value: 500 },
  { label: '1K', value: 1000 },
  { label: '2K', value: 2000 },
  { label: '5K', value: 5000 },
] as const;

export const MF_PLANS = [
  { value: 'growth', label: 'Growth' },
  { value: 'idcw', label: 'IDCW (Dividend)' },
] as const;

// Which fields are active per type
export const TYPE_FIELDS: Record<TxType, string[]> = {
  EXPENSE: [
    'date',
    'amount',
    'merchant',
    'categoryId',
    'sourceId',
    'method',
    'isPlanned',
    'isRecurring',
    'isTaxDed',
    'taxSection',
    'isReimbursable',
    'reimbDate',
    'tags',
    'notes',
    'receipt',
  ],
  INVESTMENT: [
    'date',
    'amount',
    'assetClass',
    'fundName',
    'units',
    'nav',
    'mfPlan',
    'taxSection',
    'categoryId',
    'sourceId',
    'method',
    'isRecurring',
  ],
  SINKING_DEPOSIT: ['date', 'amount', 'sfId', 'sourceId', 'method', 'isRecurring'],
  INCOME: [
    'date',
    'amount',
    'incomeType',
    'merchant',
    'tds',
    'categoryId',
    'sourceId',
    'method',
    'budgetPeriod',
    'isRecurring',
  ],
  GIFT_RECEIVED: [
    'date',
    'amount',
    'occasion',
    'giftFrom',
    'merchant',
    'categoryId',
    'sourceId',
    'method',
  ],
  REIMBURSEMENT: [
    'date',
    'amount',
    'merchant',
    'reimbFrom',
    'origTxRef',
    'categoryId',
    'sourceId',
    'method',
  ],
  TRANSFER: ['date', 'amount', 'sourceId', 'toAccountId', 'txPurpose', 'txFee', 'method'],
  ATM_WITHDRAWAL: ['date', 'amount', 'sourceId', 'atmLocation', 'atmPurpose', 'method'],
  REFUND: [
    'date',
    'amount',
    'merchant',
    'categoryId',
    'origTxRef',
    'refundReason',
    'sourceId',
    'method',
  ],
  COUPON_REDEMPTION: [
    'date',
    'amount',
    'origPrice',
    'couponCode',
    'platform',
    'merchant',
    'categoryId',
    'sourceId',
    'method',
  ],
  POINTS_REDEMPTION: [
    'date',
    'amount',
    'ptsSpent',
    'ptsRate',
    'merchant',
    'categoryId',
    'sourceId',
  ],
};
