import type { AccountSort } from '@/constants/accounts';
import type {
  AccountGroupType,
  AccountStatus,
  AccountType,
  FundAllocationType,
} from '@prisma/client';

export interface BillingCycleDto {
  startDay: number;
  dueDay: number;
}

export interface FundAllocationDto {
  fundId: string;
  accountId?: string;
  type: FundAllocationType;
  value: number;
  priority?: number;
}

export interface ListAccountsQuery {
  page?: number;
  limit?: number;
  sort?: AccountSort;
  includeArchived?: boolean;
  groupId?: string;
  type?: AccountType;
}

export interface NetWorthSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
}

export interface AccountGroupWithAccounts {
  id: string;
  name: string;
  type: AccountGroupType;
  slug: string;
  order: number;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isCollapsed: boolean;
  accounts: AccountSummary[];
}

export interface AccountSummary {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  subtype: string | null;
  balance: number;
  currency: string;
  status: AccountStatus;
  isPrimary: boolean;
  isExcludeNetWorth: boolean;
  isHidden: boolean;
  institutionId: string | null;
  groupId: string;
  archivedAt: Date | null;
}

export interface FundAllocationWithAmount extends FundAllocationDto {
  computedAmount: number;
}

export interface AccountDetail extends AccountSummary {
  openingBalance: number;
  balanceAsOf: Date | null;
  accountNumber: string | null;
  ifscCode: string | null;
  upiId: string | null;
  creditLimit: number | null;
  billingCycle: BillingCycleDto | null;
  interestRate: number | null;
  minimumPayment: number | null;
  investedAmount: number | null;
  currentValue: number | null;
  absoluteReturn: number | null;
  xirr: number | null;
  maturityDate: Date | null;
  lockInMonths: number | null;
  expectedReturn: number | null;
  category80C: boolean;
  principalAmount: number | null;
  emi: number | null;
  remainingEmis: number | null;
  interestPaidTotal: number | null;
  fundAllocations: FundAllocationWithAmount[];
  linkedAccounts: AccountSummary[];
  recentActivity: RecentActivityItem[];
  color: string | null;
  icon: string | null;
  note: string | null;
  tags: string[];
  openedOn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecentActivityItem {
  id: string;
  date: Date;
  type: string;
  amount: number;
  merchant: string | null;
  status: string;
}

export interface TransactionPage {
  items: RecentActivityItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AccountHealth {
  healthScore: number;
  utilisationPercent: number | null;
  fundFillPercent: number;
  upcomingEvents: UpcomingEventItem[];
}

export interface UpcomingEventItem {
  id: string;
  name: string;
  scheduledDate: Date;
  estimatedAmount: number;
}

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  groupId: string;
  institutionId?: string;
  balance?: number;
  openingBalance?: number;
  subtype?: string;
  currency?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  creditLimit?: number;
  billingCycle?: BillingCycleDto;
  interestRate?: number;
  minimumPayment?: number;
  investedAmount?: number;
  currentValue?: number;
  absoluteReturn?: number;
  xirr?: number;
  maturityDate?: string;
  lockInMonths?: number;
  expectedReturn?: number;
  category80C?: boolean;
  principalAmount?: number;
  emi?: number;
  remainingEmis?: number;
  interestPaidTotal?: number;
  fundAllocations?: FundAllocationDto[];
  linkedAccountIds?: string[];
  isPrimary?: boolean;
  isExcludeNetWorth?: boolean;
  isHidden?: boolean;
  color?: string;
  icon?: string;
  note?: string;
  tags?: string[];
  openedOn?: string;
}

export type UpdateAccountDto = Partial<CreateAccountDto> & {
  status?: AccountStatus;
};
