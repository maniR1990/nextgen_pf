/** Lucide icon size scale (px). MD (20px) is the default for navigation. */
export const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

export type IconSize = keyof typeof ICON_SIZES;

/** Lucide stroke width — consistent across all icons */
export const ICON_STROKE_WIDTH = 1.5;

export const ICON_SIZE_USAGE: Record<IconSize, string> = {
  xs: 'Inline text icons',
  sm: 'Buttons & badges',
  md: 'Navigation items ★',
  lg: 'Headers & primary actions',
  xl: 'Empty states',
};
