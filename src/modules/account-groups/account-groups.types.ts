import type { AccountGroupType } from '@prisma/client';
import type { AccountGroupSort } from '@/constants/account-groups';

export interface ListAccountGroupsQuery {
  page?: number;
  limit?: number;
  sort?: AccountGroupSort;
  includeArchived?: boolean;
  type?: 'asset' | 'liability';
}

export interface AccountGroupSummary {
  id: string;
  name: string;
  type: AccountGroupType;
  slug: string;
  order: number;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
  isCollapsed: boolean;
  accountCount: number;
  totalBalance: number;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountGroupDto {
  name: string;
  type: 'asset' | 'liability';
  icon?: string;
  color?: string;
  order?: number;
}

export interface UpdateAccountGroupDto {
  name?: string;
  icon?: string;
  color?: string;
  order?: number;
}

export interface ReorderAccountGroupItem {
  id: string;
  order: number;
}
