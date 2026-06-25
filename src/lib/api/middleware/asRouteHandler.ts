import type { Handler } from './types';

/** Adapts composed handlers to Next.js App Router route signature.
 * The second argument from Next.js contains { params } for dynamic segments. */
export function asRouteHandler(handler: Handler) {
  return (req: Request, nextCtx?: { params?: Promise<Record<string, string>> | Record<string, string> }) => {
    if (!nextCtx?.params) return handler(req, {});
    // Next.js 15 makes params a Promise in async components; handle both sync and async
    const paramsValue = nextCtx.params;
    if (paramsValue && typeof (paramsValue as Promise<Record<string, string>>).then === 'function') {
      return (paramsValue as Promise<Record<string, string>>).then((params) => handler(req, { params }));
    }
    return handler(req, { params: paramsValue as Record<string, string> });
  };
}
