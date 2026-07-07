'use client';

import { useEffect, useRef, useState } from 'react';

export interface UsePullToRefreshOptions {
  /** Pull distance (px) required to trigger a refresh on release. */
  threshold?: number;
  /** Visual cap on how far the indicator can be dragged, however far the finger travels. */
  maxPull?: number;
  disabled?: boolean;
}

export interface UsePullToRefreshResult {
  /** Current (dampened, capped) pull distance in px — drive an indicator's height/opacity with this. */
  pullDistance: number;
  refreshing: boolean;
  isPulling: boolean;
}

/**
 * Native-app-style pull-to-refresh, generic enough for any scrollable page. Only reacts
 * to touch gestures that start at the very top of the page (window.scrollY === 0) and
 * drag downward — mouse-driven desktop interaction never fires touch events, so this is
 * a no-op there without needing separate desktop/mobile branching.
 */
export function usePullToRefresh(
  onRefresh: () => void | Promise<void>,
  { threshold = 64, maxPull = 100, disabled = false }: UsePullToRefreshOptions = {},
): UsePullToRefreshResult {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  // Ref mirror so the touchend handler always calls the latest onRefresh without
  // needing it in the effect's dependency array (which would churn listeners on
  // every render, since inline callbacks get a new identity each time).
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (disabled) return;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) return;
      startY.current = e.touches[0]?.clientY ?? null;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current == null) return;
      const delta = (e.touches[0]?.clientY ?? startY.current) - startY.current;
      // Dampen so it feels elastic rather than 1:1 with the finger.
      setPullDistance(delta > 0 ? Math.min(delta * 0.5, maxPull) : 0);
    }

    function onTouchEnd() {
      if (startY.current == null) return;
      startY.current = null;
      setPullDistance((current) => {
        if (current >= threshold) {
          setRefreshing(true);
          void Promise.resolve(onRefreshRef.current()).finally(() => setRefreshing(false));
        }
        return 0;
      });
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [disabled, threshold, maxPull]);

  return { pullDistance, refreshing, isPulling: pullDistance > 0 };
}
