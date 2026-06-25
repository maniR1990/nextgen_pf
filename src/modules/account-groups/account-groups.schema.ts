import { z } from 'zod';
import { ACCOUNT_GROUP_SORT_OPTIONS } from '@/constants/account-groups';

export const CreateAccountGroupSchema = z.object({
  name: z.string().min(1).max(80),
  type: z.enum(['asset', 'liability']),
  icon: z.string().max(60).optional(),
  color: z.string().max(7).optional(),
  order: z.number().int().min(0).optional(),
});

export const UpdateAccountGroupSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  icon: z.string().max(60).optional(),
  color: z.string().max(7).optional(),
  order: z.number().int().min(0).optional(),
});

export const ReorderAccountGroupsSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      order: z.number().int().min(0),
    }),
  )
  .min(1);

export const ListAccountGroupsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(ACCOUNT_GROUP_SORT_OPTIONS).default('order_asc'),
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  type: z.enum(['asset', 'liability']).optional(),
});
