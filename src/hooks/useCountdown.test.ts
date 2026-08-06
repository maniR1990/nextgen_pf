import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('starts at 0 and is not active until started', () => {
    const { result } = renderHook(() => useCountdown());
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it('counts down to 0 one second at a time after start()', () => {
    const { result } = renderHook(() => useCountdown());

    act(() => result.current.start(3));
    expect(result.current.secondsLeft).toBe(3);
    expect(result.current.isActive).toBe(true);

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(2);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it('restarting while active resets the countdown', () => {
    const { result } = renderHook(() => useCountdown());

    act(() => result.current.start(5));
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsLeft).toBe(2);

    act(() => result.current.start(10));
    expect(result.current.secondsLeft).toBe(10);
  });

  it('ignores a non-positive start value', () => {
    const { result } = renderHook(() => useCountdown());
    act(() => result.current.start(0));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it('clears its interval on unmount', () => {
    const { result, unmount } = renderHook(() => useCountdown());
    act(() => result.current.start(5));
    unmount();
    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
  });
});
