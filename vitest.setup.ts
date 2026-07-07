import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

process.env.LOGGER_PROVIDER = 'pino';
process.env.LOGGER_PRETTY = 'false';
import '@/styles/globals.scss';
import { toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

// jsdom logs "Not implemented: window.scrollTo" before throwing — stub for scroll-lock teardown.
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}

// jsdom doesn't implement IntersectionObserver — needed by any infinite-scroll-style
// sentinel (useInfiniteScroll and its consumers). Tests that need it to actually fire
// intersection callbacks should install their own mock instance per-test instead.
if (typeof window !== 'undefined' && typeof window.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver = MockIntersectionObserver;
}
