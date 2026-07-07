'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Attach the returned ref to a sentinel element at the end of a paginated list.
 * Fires `onLoadMore` when the sentinel scrolls into view — the same pattern works
 * for any paginated list (transactions, notifications, activity feeds, etc.).
 *
 * `rootMargin` triggers the load before the sentinel is fully on-screen (default:
 * 200px early), so the next page is usually ready before the user reaches the bottom.
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  rootMargin = '200px',
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) onLoadMore();
        },
        { rootMargin },
      );
      observerRef.current.observe(node);
    },
    [onLoadMore, hasMore, rootMargin],
  );

  useEffect(() => () => observerRef.current?.disconnect(), []);

  return sentinelRef;
}
