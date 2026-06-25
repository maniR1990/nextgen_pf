import { z } from 'zod';

export const CreateRecurringTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  type: z.enum(['INCOME', 'EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT']),
  frequency: z.enum(['MONTHLY', 'TWICE_MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'ANNUAL', 'EVERY_2_MONTHS']),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  secondDayOfMonth: z.number().int().min(1).max(31).optional(),
  months: z.array(z.number().int().min(1).max(12)).optional(),
  estimatedAmount: z.number().positive('Amount must be > 0'),
  budgetType: z.enum(['AUTO', 'MANUAL', 'NONE']).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  toAccountId: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const PatchRecurringTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  estimatedAmount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
}).strict();

export const PreviewOccurrencesSchema = z.object({
  count: z.number().int().min(1).max(12).default(5),
});
