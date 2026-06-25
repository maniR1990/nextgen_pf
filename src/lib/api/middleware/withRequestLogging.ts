import { getLogger } from '@/lib/logger';
import type { Middleware } from './types';

export function withRequestLogging(tag = 'http'): Middleware {
  return (handler) => async (req, ctx) => {
    const url = new URL(req.url);
    const correlationId = req.headers.get('x-correlation-id') ?? crypto.randomUUID();
    const log = getLogger(tag).child({
      correlationId,
      method: req.method,
      path: url.pathname,
      action: 'request',
    });

    const start = Date.now();
    log.info('request.start');

    try {
      const response = await handler(req, { ...ctx, correlationId });
      log.info('request.end', { status: response.status, durationMs: Date.now() - start });
      const headers = new Headers(response.headers);
      headers.set('x-correlation-id', correlationId);
      return new Response(response.body, { status: response.status, headers });
    } catch (err) {
      log.error('request.error', { err, durationMs: Date.now() - start });
      throw err;
    }
  };
}
