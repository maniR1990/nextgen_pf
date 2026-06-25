import { z } from 'zod';

export const BudgetImpactSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive('Amount must be > 0'),
  budgetPeriodYear: z.number().int().min(2020).max(2100),
  budgetPeriodMonth: z.number().int().min(1).max(12),
});

export const UpdateCategoryPlannedSchema = z.object({
  planned: z.number().nonnegative('Planned amount must be ≥ 0'),
});
