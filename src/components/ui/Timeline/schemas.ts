import {
  TIMELINE_DEFAULT_ARIA_LABEL,
  TIMELINE_DEFAULT_VARIANT,
  TIMELINE_DENSITY,
  TIMELINE_TONE_VALUES,
  TIMELINE_VARIANT_VALUES,
} from '@/constants/timeline';
import { z } from 'zod';

const timelineToneSchema = z.enum(TIMELINE_TONE_VALUES as [string, ...string[]]);

export const TimelineAmountSchema = z.object({
  label: z.string().min(1),
  tone: timelineToneSchema.optional(),
});

export const TimelineLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

export const TimelineItemSchema = z.object({
  id: z.string().min(1),
  timestampLabel: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  tone: timelineToneSchema,
  projected: z.boolean().optional(),
  emoji: z.string().max(4).optional(),
  amount: TimelineAmountSchema.optional(),
  link: TimelineLinkSchema.optional(),
});

export const TimelineConfigSchema = z.object({
  variant: z.enum(TIMELINE_VARIANT_VALUES as [string, ...string[]]).default(TIMELINE_DEFAULT_VARIANT),
  ariaLabel: z.string().min(1).default(TIMELINE_DEFAULT_ARIA_LABEL),
  items: z.array(TimelineItemSchema).min(1),
});

export const TimelinePropsSchema = z.object({
  config: TimelineConfigSchema,
  density: z.enum([TIMELINE_DENSITY.COMFORTABLE, TIMELINE_DENSITY.COMPACT]).optional(),
});

export type TimelineItemJson = z.infer<typeof TimelineItemSchema>;
export type TimelineConfigJson = z.infer<typeof TimelineConfigSchema>;
