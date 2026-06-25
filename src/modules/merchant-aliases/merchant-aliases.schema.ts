import { z } from 'zod';

export const CreateMerchantAliasSchema = z.object({
  pattern: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  method: z.enum(['EXACT', 'REGEX']).default('EXACT'),
});

export const MatchMerchantSchema = z.object({
  merchantName: z.string().min(1).max(300),
});
