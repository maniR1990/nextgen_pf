export interface CreateRecurringTemplateDto {
  name: string;
  type: string;
  frequency: string;
  dayOfMonth?: number;
  secondDayOfMonth?: number;
  months?: number[];
  estimatedAmount: number;
  budgetType?: string;
  categoryId?: string;
  accountId?: string;
  toAccountId?: string;
  tags?: string[];
  fundGroupId?: string | null;
  fundGroupFlow?: 'IN' | 'OUT' | null;
}

export interface PatchRecurringTemplateDto {
  name?: string;
  estimatedAmount?: number;
  isActive?: boolean;
  dayOfMonth?: number;
  categoryId?: string;
  accountId?: string;
  fundGroupId?: string | null;
  fundGroupFlow?: 'IN' | 'OUT' | null;
}
