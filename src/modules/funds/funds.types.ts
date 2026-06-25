import type { FundSort } from '@/constants/funds';
import type { FundAllocationType, FundPurpose } from '@prisma/client';

export interface FundAllocationInput {
  accountId: string;
  type: FundAllocationType;
  value: number;
  priority?: number;
}

export interface SourceBreakdown {
  accountId: string;
  accountName: string;
  accountCode: string;
  type: FundAllocationType;
  value: number;
  priority: number;
  allocatedAmount: number;
  accountBalance: number;
}

export interface FundSummary {
  id: string;
  name: string;
  purpose: FundPurpose;
  groupId: string | null;
  groupName: string | null;
  groupSlug: string | null;
  groupDescription: string | null;
  targetAmount: number;
  targetMonths: number | null;
  currentAmount: number;
  percentFilled: number;
  sources: SourceBreakdown[];
  goalId: string | null;
  color: string | null;
  icon: string | null;
  order: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListFundsQuery {
  page?: number;
  limit?: number;
  sort?: FundSort;
  includeArchived?: boolean;
  purpose?: FundPurpose;
}

export interface CreateFundDto {
  name: string;
  purpose: FundPurpose;
  groupId?: string;
  targetAmount?: number;
  targetMonths?: number;
  sources?: FundAllocationInput[];
  color?: string;
  icon?: string;
  order?: number;
  goalId?: string;
}

export type UpdateFundDto = Partial<CreateFundDto>;

export interface AllocateFundDto {
  accountId: string;
  type: FundAllocationType;
  value: number;
  priority?: number;
}

export interface FundsAggregateSummary {
  totalAllocated: number;
  totalUnallocated: number;
  totalTarget: number;
  overallFillPercent: number;
  fundHealthRadar: FundHealthRadarItem[];
  currency: string;
}

export interface FundHealthRadarItem {
  id: string;
  name: string;
  purpose: FundPurpose;
  currentAmount: number;
  targetAmount: number;
  percentFilled: number;
  health: 'healthy' | 'ok' | 'low' | 'empty';
}
