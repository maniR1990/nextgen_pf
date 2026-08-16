import { PROJECT_SORT_OPTIONS, PROJECT_STATUSES } from '@/constants/projects';
import { z } from 'zod';

const EDITABLE_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD'] as const;

function noDualFunding(d: { fundingAccountId?: string; fundingFundId?: string }) {
  return !(d.fundingAccountId && d.fundingFundId);
}

function completionOnOrAfterStart(d: { startDate?: string; targetCompletionDate?: string }) {
  if (!d.startDate || !d.targetCompletionDate) return true;
  return new Date(d.targetCompletionDate) >= new Date(d.startDate);
}

export const CreateForecastLineSchema = z.object({
  description: z.string().min(1).max(2000),
  forecastAmount: z.number().finite().positive(),
  vendorId: z.string().optional(),
});

export const UpdateForecastLineSchema = z.object({
  description: z.string().min(1).max(2000).optional(),
  forecastAmount: z.number().finite().positive().optional(),
  vendorId: z.string().optional(),
});

const createProjectBodySchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime().optional(),
  targetCompletionDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  fundingAccountId: z.string().min(1).optional(),
  fundingFundId: z.string().min(1).optional(),
  // Initial forecast lines, set atomically with the project — the wizard's
  // "Forecast" section. Editing lines on an existing project goes through the
  // dedicated addForecastLine/updateForecastLine/removeForecastLine actions
  // instead (the Budget forecast tab), not this bulk field.
  forecastLines: z.array(CreateForecastLineSchema).optional(),
});

export const CreateProjectSchema = createProjectBodySchema
  .refine(noDualFunding, { message: 'Provide at most one of fundingAccountId or fundingFundId' })
  .refine(completionOnOrAfterStart, {
    message: 'targetCompletionDate must be on or after startDate',
  });

const updateProjectBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.string().datetime().optional(),
  targetCompletionDate: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
  fundingAccountId: z.string().min(1).optional(),
  fundingFundId: z.string().min(1).optional(),
  // COMPLETED/ARCHIVED are deliberately excluded — those only happen via the
  // dedicated close/reopen actions (Slice 6), never a generic field write.
  status: z.enum(EDITABLE_STATUSES).optional(),
});

export const UpdateProjectSchema = updateProjectBodySchema
  .refine(noDualFunding, { message: 'Provide at most one of fundingAccountId or fundingFundId' })
  .refine(completionOnOrAfterStart, {
    message: 'targetCompletionDate must be on or after startDate',
  });

export const CreateVendorSchema = z.object({
  name: z.string().min(1).max(120),
  contractAmount: z.number().finite().positive(),
  notes: z.string().max(2000).optional(),
});

export const UpdateVendorSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  contractAmount: z.number().finite().positive().optional(),
  notes: z.string().max(2000).optional(),
});

const NOTE_TAGS = ['PROGRESS', 'DECISION', 'DELIVERY', 'RETURN', 'MISC'] as const;

export const CreateActivityItemSchema = z
  .discriminatedUnion('kind', [
    z.object({ kind: z.literal('todo'), text: z.string().min(1).max(500) }),
    z.object({
      kind: z.literal('note'),
      text: z.string().min(1).max(2000),
      tag: z.enum(NOTE_TAGS),
      date: z.string().datetime().optional(),
      returnOfTransactionId: z.string().optional(),
    }),
    z.object({
      kind: z.literal('reference'),
      key: z.string().min(1).max(120),
      value: z.string().min(1).max(500),
      vendorId: z.string().optional(),
    }),
  ])
  .superRefine((data, ctx) => {
    if (data.kind === 'note' && data.tag === 'RETURN' && !data.returnOfTransactionId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'returnOfTransactionId is required for a return-tagged note',
        path: ['returnOfTransactionId'],
      });
    }
  });

// Deliberately permissive (no per-kind discrimination) — the service resolves which
// array the item lives in and applies only the fields relevant to that item's kind.
export const UpdateActivityItemSchema = z.object({
  done: z.boolean().optional(),
  text: z.string().min(1).max(2000).optional(),
  key: z.string().min(1).max(120).optional(),
  value: z.string().min(1).max(500).optional(),
});

export const ListProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(PROJECT_SORT_OPTIONS).default('created_desc'),
  status: z.enum(PROJECT_STATUSES).optional(),
});
