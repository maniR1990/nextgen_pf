import { z } from 'zod';

export const ReportFilterQuerySchema = z
  .object({
    year: z.coerce.number().int().min(2020).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    // Comma-separated list of category ids — a report can compare several categories
    // together (e.g. "Groceries" + "Household"), unlike the single-category picker used
    // for logging a transaction.
    categoryIds: z
      .string()
      .min(1)
      .optional()
      .transform((v) => (v ? v.split(',').filter(Boolean) : undefined)),
    type: z.enum(['EXPENSE', 'INCOME', 'INVESTMENT']).optional(),
    accountId: z.string().min(1).optional(),
  })
  .refine((v) => (v.year === undefined) === (v.month === undefined), {
    message: 'year and month must be provided together',
  });

export type ReportFilterQuery = z.infer<typeof ReportFilterQuerySchema>;
