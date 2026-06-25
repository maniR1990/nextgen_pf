import type { Handler, Middleware } from './types';

export function compose(...middlewares: Middleware[]) {
  return (handler: Handler): Handler =>
    middlewares.reduceRight((h, m) => m(h), handler);
}
