import type { CategorySort } from '@/constants/categories';
import type { CategoryFlowType, MatchRuleField, MatchRuleOperator } from '@prisma/client';

export interface MatchRuleDto {
  field: MatchRuleField;
  operator: MatchRuleOperator;
  value: string | number | [number, number];
  priority?: number;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
  path: string;
  type: CategoryFlowType;
  monthlyBudget: number;
  budgetRollover: boolean;
  matchRules: MatchRuleDto[];
  color: string | null;
  icon: string | null;
  order: number;
  isSystem: boolean;
  isActive: boolean;
  monthlySpend: number;
  budget: number;
  archivedAt: Date | null;
  children: CategoryTreeNode[];
}

export interface ListCategoriesQuery {
  type?: 'income' | 'expense' | 'investment' | 'transfer';
  includeArchived?: boolean;
  page?: number;
  limit?: number;
  sort?: CategorySort;
}

export interface CreateCategoryDto {
  name: string;
  parentId?: string | null;
  type?: CategoryFlowType;
  monthlyBudget?: number;
  budgetRollover?: boolean;
  matchRules?: MatchRuleDto[];
  color?: string;
  icon?: string;
  order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  color?: string;
  monthlyBudget?: number;
  budgetRollover?: boolean;
  matchRules?: MatchRuleDto[];
}

export interface ReorderCategoryItem {
  id: string;
  parentId: string | null;
  order: number;
}

export interface CategoryStats {
  categoryId: string;
  name: string;
  path: string;
  monthlyBudget: number;
  currentMonthSpend: number;
  budgetVariance: number;
  monthlyTrend: MonthlyTrendPoint[];
  topTransactions: CategoryTopTransaction[];
}

export interface MonthlyTrendPoint {
  year: number;
  month: number;
  spend: number;
  budget: number;
  variance: number;
}

export interface CategoryTopTransaction {
  id: string;
  date: Date;
  merchant: string | null;
  amount: number;
  type: string;
  status: string;
}
