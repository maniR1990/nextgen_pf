import { z } from 'zod';

export const INSTITUTION_TYPES = [
  'BANK',
  'NBFC',
  'AMC',
  'BROKER',
  'INSURER',
  'WALLET',
  'POST_OFFICE',
] as const;

export const ListInstitutionsQuerySchema = z.object({
  type: z.enum(INSTITUTION_TYPES).optional(),
  search: z.string().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const CreateInstitutionSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().min(1).max(20),
  type: z.enum(INSTITUTION_TYPES),
  logoUrl: z.string().url().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  ifscPattern: z.string().max(50).optional(),
});
