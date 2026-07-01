'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type State = 'idle' | 'loading' | 'done';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show bar on any internal link click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      // Skip external, hash, and non-navigation links
      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      )
        return;
      // Skip if same path (no navigation will happen)
      if (href === pathname) return;
      setState('loading');
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname]);

  // When route change completes, flash "done" then return to idle
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit state to avoid infinite loop; pathname/searchParams trigger on route change
  useEffect(() => {
    if (state !== 'loading') return;
    setState('done');
    timerRef.current = setTimeout(() => setState('idle'), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, searchParams]);

  if (state === 'idle') return null;

  return (
    <div
      className={`nav-progress nav-progress--${state}`}
      role="progressbar"
      aria-label="Navigating…"
      aria-valuetext={state === 'loading' ? 'Loading page' : 'Done'}
    />
  );
}
