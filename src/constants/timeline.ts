export const TIMELINE_TONE = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  ACCENT: 'accent',
  MUTED: 'muted',
} as const;

export type TimelineTone = (typeof TIMELINE_TONE)[keyof typeof TIMELINE_TONE];

export const TIMELINE_TONE_VALUES = Object.values(TIMELINE_TONE);

export const TIMELINE_VARIANT = {
  TRANSACTION: 'transaction',
  MILESTONE: 'milestone',
  AUDIT: 'audit',
} as const;

export type TimelineVariant = (typeof TIMELINE_VARIANT)[keyof typeof TIMELINE_VARIANT];

export const TIMELINE_VARIANT_VALUES = Object.values(TIMELINE_VARIANT);

export const TIMELINE_DENSITY = {
  COMFORTABLE: 'comfortable',
  COMPACT: 'compact',
} as const;

export type TimelineDensity = (typeof TIMELINE_DENSITY)[keyof typeof TIMELINE_DENSITY];

export const TIMELINE_DEFAULT_DENSITY: TimelineDensity = TIMELINE_DENSITY.COMFORTABLE;

export const TIMELINE_DEFAULT_VARIANT: TimelineVariant = TIMELINE_VARIANT.TRANSACTION;

export const TIMELINE_DEFAULT_ARIA_LABEL = 'Activity timeline';
