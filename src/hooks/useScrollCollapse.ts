import { useEffect, useRef, useState } from 'react';

/**
 * True once the user has scrolled down past thresholdPx; resets to false as soon as
 * they scroll back up. Shared by the header pulse strip and the footer so the two stay
 * in lockstep — the footer becomes visible exactly when the pulse strip above it hides,
 * rather than both showing at once.
 */
export function useScrollCollapse(thresholdPx: number): boolean {
  const [collapsed, setCollapsed] = useState(false);
  const prevScrollY = useRef(0);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const scrollingDown = y > prevScrollY.current;
      if (scrollingDown && y > thresholdPx) {
        setCollapsed(true);
      } else if (!scrollingDown) {
        setCollapsed(false);
      }
      prevScrollY.current = y;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [thresholdPx]);

  return collapsed;
}
