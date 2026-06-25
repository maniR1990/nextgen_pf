import { z } from 'zod';

const PrismaBudgetLineKind = z.enum(['SECTION', 'GROUP', 'LINE']);
const PrismaBudgetTag = z.enum(['MANUAL', 'AUTO']);
const PrismaBudgetVariant = z.enum([
  'INCOME',
  'HOUSEHOLD',
  'INSURANCE',
  'SINKING',
  'SUBSCRIPTIONS',
  'INVESTMENTS',
  'EMIS',
  'UNPLANNED',
]);

export const CreateBudgetLineSchema = z.object({
  parentId: z.string().nullable().optional(),
  title: z.string().min(1).max(120),
  kind: PrismaBudgetLineKind,
  variant: PrismaBudgetVariant.nullable().optional(),
  plannedMinor: z.number().int().nonnegative().optional(),
  spentMinor: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  tag: PrismaBudgetTag.nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  typeLabel: z.string().max(80).nullable().optional(),
});

export const UpdateBudgetLineSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  plannedMinor: z.number().int().nonnegative().optional(),
  spentMinor: z.number().int().nonnegative().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
  tag: PrismaBudgetTag.nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  typeLabel: z.string().max(80).nullable().optional(),
});
