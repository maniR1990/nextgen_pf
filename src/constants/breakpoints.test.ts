import { describe, expect, it } from 'vitest';
import { BREAKPOINT_ORDER, BREAKPOINTS, MOBILE_DESIGN_WIDTH } from './breakpoints';

describe('breakpoints', () => {
  it('defines mobile-first min-width scale', () => {
    expect(BREAKPOINTS.xs).toBe(320);
    expect(BREAKPOINTS.sm).toBe(640);
    expect(BREAKPOINTS.md).toBe(768);
    expect(BREAKPOINTS.lg).toBe(1024);
    expect(BREAKPOINTS.xl).toBe(1280);
    expect(BREAKPOINTS['2xl']).toBe(1536);
  });

  it('uses 375px as design target', () => {
    expect(MOBILE_DESIGN_WIDTH).toBe(375);
  });

  it('orders breakpoints ascending', () => {
    const widths = BREAKPOINT_ORDER.map((name) => BREAKPOINTS[name]);
    expect(widths).toEqual([...widths].sort((a, b) => a - b));
  });
});
