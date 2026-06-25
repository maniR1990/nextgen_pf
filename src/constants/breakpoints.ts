/** Mobile-first breakpoint min-widths (px). Match `src/styles/tokens/_breakpoints.scss`. */
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/** Canonical mobile design width — build for 375px first. */
export const MOBILE_DESIGN_WIDTH = 375;

export type BreakpointName = keyof typeof BREAKPOINTS;

export const BREAKPOINT_ORDER: BreakpointName[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
