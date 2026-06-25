import type { TxType } from '@/constants/finance';
import type { TransactionSort } from '@/constants/transactions';
import type { CreateFinanceTransactionDto } from '@/types/finance';
import type { FinanceTransactionStatus } from '@prisma/client';

export interface CreateTransactionDto extends CreateFinanceTransactionDto {
  userId: string;
  idempotencyKey?: string;
}

export interface GetTransactionsQuery {
  userId: string;
  page?: number;
  limit?: number;
  type?: TxType;
  fromDate?: string;
  toDate?: string;
  categoryId?: string;
  search?: string;
}

export interface ListWithCursorQuery {
  userId: string;
  cursor?: string;
  limit?: number;
  type?: TxType;
  types?: TxType[];
  budgetPeriodYear?: number;
  budgetPeriodMonth?: number;
  fromDate?: string;
  toDate?: string;
  categoryId?: string;
  paymentSourceId?: string;
  status?: FinanceTransactionStatus;
  search?: string;
  sort?: TransactionSort;
}

export interface PatchTransactionDto {
  type?: string;
  date?: string;
  amount?: number;
  merchant?: string;
  categoryId?: string;
  paymentSourceId?: string;
  toAccountId?: string;
  paymentMethod?: string;
  isPlanned?: boolean;
  isRecurring?: boolean;
  notes?: string;
  tags?: string[];
  budgetPeriodYear?: number;
  budgetPeriodMonth?: number;
  assetClass?: string;
  fundName?: string;
  units?: number;
  nav?: number;
  mfPlan?: string;
  taxSection?: string;
  incomeType?: string;
  tds?: number;
  giftFrom?: string;
  occasion?: string;
  sfId?: string;
  isTaxDed?: boolean;
  isReimbursable?: boolean;
  reimbDate?: string;
  reimbFrom?: string;
  origTxRef?: string;
  txPurpose?: string;
  txFee?: number;
  atmLocation?: string;
  atmPurpose?: string;
  refundReason?: string;
  origPrice?: number;
  couponCode?: string;
  platform?: string;
  ptsSpent?: number;
  ptsRate?: number;
  recSchedule?: {
    frequency: string;
    every: number;
    endCondition: 'forever' | 'count' | 'date';
    count?: number;
    endDate?: string;
  };
  fundGroupId?: string | null;
  fundGroupFlow?: 'IN' | 'OUT' | null;
}

export interface FraudFacts {
  amount: number;
  accountAgeDays: number;
  countryMatch: boolean;
}
