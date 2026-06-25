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
