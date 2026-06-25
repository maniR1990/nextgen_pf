import { z } from 'zod';

export const CreateAttachmentSchema = z.object({
  filename: z.string().min(1).max(255),
  url: z.string().url('Must be a valid URL'),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});
