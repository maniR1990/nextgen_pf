import type { Handler } from './types';

/** Adapts composed handlers to Next.js App Router route signature.
 * Next.js 15 always passes params as a Promise; second arg is never undefined. */
export function asRouteHandler(handler: Handler) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    const params = ctx?.params ? await ctx.params : {};
    return handler(req, { params });
  };
}
