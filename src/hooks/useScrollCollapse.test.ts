import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useScrollCollapse } from './useScrollCollapse';

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, writable: true, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

afterEach(() => scrollTo(0));

describe('useScrollCollapse', () => {
  it('starts uncollapsed', () => {
    const { result } = renderHook(() => useScrollCollapse(40));
    expect(result.current).toBe(false);
  });

  it('collapses once scrolled down past the threshold', () => {
    const { result } = renderHook(() => useScrollCollapse(40));
    scrollTo(41);
    expect(result.current).toBe(true);
  });

  it('stays uncollapsed when scrolling down but still under the threshold', () => {
    const { result } = renderHook(() => useScrollCollapse(40));
    scrollTo(30);
    expect(result.current).toBe(false);
  });

  it('re-expands as soon as the user scrolls back up, even above the threshold', () => {
    const { result } = renderHook(() => useScrollCollapse(40));
    scrollTo(200);
    expect(result.current).toBe(true);
    scrollTo(150);
    expect(result.current).toBe(false);
  });
});
