import { FundPurpose } from '@prisma/client';
import { z } from 'zod';
import { FUND_ALLOCATION_TYPES, FUND_PURPOSES, FUND_SORT_OPTIONS } from '@/constants/funds';

const fundAllocationSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(FUND_ALLOCATION_TYPES),
  value: z.number().finite().nonnegative(),
  priority: z.number().int().min(0).default(0),
});

const fundBodySchema = z.object({
  name: z.string().min(1).max(120),
  purpose: z.enum(FUND_PURPOSES as unknown as [FundPurpose, ...FundPurpose[]]),
  groupId: z.string().min(1).optional(),
  targetAmount: z.number().finite().nonnegative().optional(),
  targetMonths: z.number().int().min(1).max(120).optional(),
  sources: z.array(fundAllocationSchema).optional(),
  color: z.string().max(7).optional(),
  icon: z.string().max(60).optional(),
  order: z.number().int().min(0).optional(),
  goalId: z.string().min(1).optional(),
});

export const CreateFundSchema = fundBodySchema.refine(
  (d) => (d.targetAmount ?? 0) > 0 || (d.targetMonths ?? 0) > 0,
  { message: 'Provide targetAmount or targetMonths' },
);

export const UpdateFundSchema = fundBodySchema.partial();

export const AllocateFundSchema = fundAllocationSchema;

export const SaveAllocationsSchema = z.object({
  sources: z.array(fundAllocationSchema),
});

export const ListFundsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(FUND_SORT_OPTIONS).default('order_asc'),
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  purpose: z.enum(FUND_PURPOSES as unknown as [FundPurpose, ...FundPurpose[]]).optional(),
});
