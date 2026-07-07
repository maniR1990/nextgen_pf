import { z } from 'zod';

export const BudgetImpactSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive('Amount must be > 0'),
  budgetPeriodYear: z.number().int().min(2020).max(2100),
  budgetPeriodMonth: z.number().int().min(1).max(12),
});

export const UpdateCategoryPlannedSchema = z
  .object({
    planned: z.number().nonnegative('Planned amount must be ≥ 0').optional(),
    isRecurring: z.boolean().optional(),
    isUnplanned: z.boolean().optional(),
    dueDay: z.number().int().min(1).max(31).nullable().optional(),
    settled: z.boolean().optional(),
    settledTransactionId: z.string().min(1).nullable().optional(),
  })
  .refine(
    (d) =>
      d.planned !== undefined ||
      d.isRecurring !== undefined ||
      d.isUnplanned !== undefined ||
      d.dueDay !== undefined ||
      d.settled !== undefined,
    { message: 'At least one field must be provided' },
  );
