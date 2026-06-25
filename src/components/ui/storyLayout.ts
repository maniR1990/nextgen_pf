import { BREAKPOINTS, MOBILE_DESIGN_WIDTH } from '@/constants/breakpoints';

export const storyRowStyle = {
  display: 'flex',

  flexWrap: 'wrap' as const,

  gap: 'var(--space-4)',

  alignItems: 'flex-start',
};

export const storyGridStyle = {
  display: 'grid',

  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',

  gap: 'var(--space-4)',

  width: '100%',

  maxWidth: 'calc(56 * var(--space-4))',
};

export const storySectionStyle = {
  display: 'flex',

  flexDirection: 'column' as const,

  gap: 'var(--space-6)',

  padding: 'var(--space-6)',

  width: '100%',
};

export const chromaticBaseline = {
  chromatic: { disableSnapshot: false },
};

/** 375px design target */

export const viewportMobile = { viewport: { defaultViewport: 'mobile375' as const } };

export const viewportTablet = { viewport: { defaultViewport: 'md' as const } };

export const viewportDesktop = { viewport: { defaultViewport: 'xl' as const } };

export const viewportXs = { viewport: { defaultViewport: 'xs' as const } };

export const viewportSm = { viewport: { defaultViewport: 'sm' as const } };

export const viewportLg = { viewport: { defaultViewport: 'lg' as const } };

export const viewport2xl = { viewport: { defaultViewport: '2xl' as const } };

export const viewportXl = viewportDesktop;

export const breakpointPx = BREAKPOINTS;

export const mobileDesignWidth = MOBILE_DESIGN_WIDTH;

export const storyScrollRowStyle = {
  display: 'flex',

  flexWrap: 'nowrap' as const,

  gap: 'var(--space-2)',

  overflowX: 'auto' as const,

  paddingBottom: 'var(--space-1)',

  width: '100%',

  WebkitOverflowScrolling: 'touch' as const,
};
