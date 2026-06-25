declare module 'jest-axe' {
  import type { AxeResults } from 'axe-core';

  export function axe(container: Element): Promise<AxeResults>;
  export const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): { pass: boolean; message: () => string };
  };
}
