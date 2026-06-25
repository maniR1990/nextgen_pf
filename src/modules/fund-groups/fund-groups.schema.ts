import { z } from 'zod';

export const CreateFundGroupSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(200).optional(),
  color: z.string().max(7).optional(),
  order: z.number().int().min(0).optional(),
});

export const UpdateFundGroupSchema = CreateFundGroupSchema.partial();
