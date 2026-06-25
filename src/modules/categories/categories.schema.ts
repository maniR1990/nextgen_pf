import { z } from 'zod';
import {
  CATEGORY_FLOW_TYPES,
  CATEGORY_SORT_OPTIONS,
  MATCH_RULE_FIELDS,
  MATCH_RULE_OPERATORS,
} from '@/constants/categories';

const matchRuleSchema = z.object({
  field: z.enum(MATCH_RULE_FIELDS),
  operator: z.enum(MATCH_RULE_OPERATORS),
  value: z.union([
    z.string(),
    z.number(),
    z.tuple([z.number(), z.number()]),
  ]),
  priority: z.number().int().min(0).default(0),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(80),
  parentId: z.string().min(1).nullable().optional(),
  type: z.enum(CATEGORY_FLOW_TYPES).optional(),
  monthlyBudget: z.number().finite().nonnegative().optional(),
  budgetRollover: z.boolean().optional(),
  matchRules: z.array(matchRuleSchema).optional(),
  color: z.string().max(7).optional(),
  icon: z.string().max(60).optional(),
  order: z.number().int().min(0).optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  icon: z.string().max(60).optional(),
  color: z.string().max(7).optional(),
  monthlyBudget: z.number().finite().nonnegative().optional(),
  budgetRollover: z.boolean().optional(),
  matchRules: z.array(matchRuleSchema).optional(),
});

export const ReorderCategoriesSchema = z
  .array(
    z.object({
      id: z.string().min(1),
      parentId: z.string().min(1).nullable(),
      order: z.number().int().min(0),
    }),
  )
  .min(1);

export const ListCategoriesQuerySchema = z.object({
  type: z.enum(['income', 'expense', 'investment', 'transfer']).optional(),
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(500),
  sort: z.enum(CATEGORY_SORT_OPTIONS).default('order_asc'),
});
