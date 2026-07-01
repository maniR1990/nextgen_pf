import type { TxType } from '@/constants/finance';

export interface BudgetPeriod {
  year: number;
  month: number;
}

export interface RecSchedule {
  frequency: string;
  every: number;
  endCondition: 'forever' | 'count' | 'date';
  count?: number;
  endDate?: string;
}

export interface PaymentSourceOption {
  id: string;
  name: string;
  type: string;
  balance: number;
  bank?: string;
  rewardPoints?: number;
}

export interface CategoryOption {
  id: string;
  label: string;
  parentLabel?: string;
  depth: number;
  plannedAmount?: number;
  type: string;
  icon?: string;
  color?: string;
}

export interface SinkingFundOption {
  id: string;
  label: string;
  target: number;
  saved: number;
  monthly: number;
  color?: string;
}

export interface BudgetImpact {
  categoryId: string;
  categoryLabel: string;
  planned: number;
  spent: number;
  thisTx: number;
  remaining: number;
  percentUsed: number;
  state: 'ok' | 'warning' | 'over';
}

export interface DuplicateMatch {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  sourceLabel: string;
  method: string;
}

// The full create DTO that maps to FinanceTransaction in Prisma
export interface CreateFinanceTransactionDto {
  type: TxType;
  date: string;
  budgetPeriodYear: number;
  budgetPeriodMonth: number;
  amount: number;
  merchant?: string;
  categoryId?: string;
  paymentSourceId: string;
  toAccountId?: string;
  paymentMethod: string;
  isPlanned: boolean;
  isRecurring: boolean;
  notes?: string;
  tags?: string[];
  status?: string;

  // Investment
  assetClass?: string;
  fundName?: string;
  units?: number;
  nav?: number;
  mfPlan?: string;
  taxSection?: string;

  // Income
  incomeType?: string;
  tds?: number;

  // Gift
  giftFrom?: string;
  occasion?: string;

  // Sinking
  sfId?: string;

  // Expense extras
  isTaxDed?: boolean;
  isReimbursable?: boolean;
  reimbDate?: string;

  // Reimbursement
  reimbFrom?: string;
  origTxRef?: string;

  // Transfer
  txPurpose?: string;
  txFee?: number;

  // ATM
  atmLocation?: string;
  atmPurpose?: string;

  // Refund
  refundReason?: string;

  // Coupon
  origPrice?: number;
  couponCode?: string;
  platform?: string;

  // Points
  ptsSpent?: number;
  ptsRate?: number;

  // Recurring schedule
  recSchedule?: RecSchedule;

  // Fund group tagging
  fundGroupId?: string | null;
  fundGroupFlow?: 'IN' | 'OUT' | null;
}

export interface FinanceTransactionRow {
  id: string;
  type: TxType;
  date: string;
  amount: number;
  merchant?: string;
  categoryLabel?: string;
  sourceLabel?: string;
  toAccountName?: string;
  method: string;
  status: string;
  isPlanned: boolean;
  isRecurring: boolean;
  notes?: string;
  tags: string[];
  budgetPeriodYear: number;
  budgetPeriodMonth: number;
  createdAt: string;
}
