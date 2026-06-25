import { z } from 'zod';
import {
  BUDGET_ENTRY_TAG,
  BUDGET_LINE_KIND,
  BUDGET_SECTION_VARIANT,
} from '@/constants/budget';

export const BudgetMetricsSchema = z.object({
  plannedMinor: z.number().int(),
  spentMinor: z.number().int(),
  remainingMinor: z.number().int(),
  percent: z.number().int().min(0).max(100),
});

const budgetKindSchema = z.enum([
  BUDGET_LINE_KIND.SECTION,
  BUDGET_LINE_KIND.GROUP,
  BUDGET_LINE_KIND.LINE,
  BUDGET_LINE_KIND.SUMMARY,
]);

const budgetVariantSchema = z.enum([
  BUDGET_SECTION_VARIANT.INCOME,
  BUDGET_SECTION_VARIANT.HOUSEHOLD,
  BUDGET_SECTION_VARIANT.INSURANCE,
  BUDGET_SECTION_VARIANT.SINKING,
  BUDGET_SECTION_VARIANT.SUBSCRIPTIONS,
  BUDGET_SECTION_VARIANT.INVESTMENTS,
  BUDGET_SECTION_VARIANT.EMIS,
  BUDGET_SECTION_VARIANT.UNPLANNED,
]);

const budgetTagSchema = z.enum([BUDGET_ENTRY_TAG.MANUAL, BUDGET_ENTRY_TAG.AUTO]);

export type BudgetLedgerNodeJson = z.infer<typeof BudgetMetricsSchema> & {
  id: string;
  title: string;
  kind: z.infer<typeof budgetKindSchema>;
  variant?: z.infer<typeof budgetVariantSchema> | null;
  tag?: z.infer<typeof budgetTagSchema> | null;
  note?: string | null;
  typeLabel?: string | null;
  sortOrder?: number;
  children?: BudgetLedgerNodeJson[];
};

export const BudgetLedgerNodeSchema: z.ZodType<BudgetLedgerNodeJson> = z.lazy(() =>
  BudgetMetricsSchema.extend({
    id: z.string(),
    title: z.string(),
    kind: budgetKindSchema,
    variant: budgetVariantSchema.nullable().optional(),
    tag: budgetTagSchema.nullable().optional(),
    note: z.string().nullable().optional(),
    typeLabel: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
    children: z.array(BudgetLedgerNodeSchema).optional(),
  }),
);

export const BudgetSummaryRowSchema = BudgetMetricsSchema.extend({
  id: z.string(),
  title: z.string(),
  tone: z.enum(['default', 'success', 'warning']).optional(),
});

export const BudgetLedgerPayloadSchema = z.object({
  rows: z.array(BudgetLedgerNodeSchema),
  summaries: z.array(BudgetSummaryRowSchema),
});

export const BudgetLineFormSchema = z.object({
  title: z.string().min(1).max(120),
  plannedMinor: z.coerce.number().int().nonnegative(),
  spentMinor: z.coerce.number().int().nonnegative(),
  note: z.string().max(500).optional(),
  typeLabel: z.string().max(80).optional(),
});

export type BudgetLineFormValues = z.infer<typeof BudgetLineFormSchema>;
