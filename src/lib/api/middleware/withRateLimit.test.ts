import { describe, expect, it } from 'vitest';
import { withRateLimit } from './withRateLimit';
import type { RouteContext } from './types';

const ctx: RouteContext = {};

function reqFrom(ip: string): Request {
  return new Request('http://localhost/api/test', { headers: { 'x-forwarded-for': ip } });
}

describe('withRateLimit', () => {
  it('allows requests under the limit through to the handler', async () => {
    const handler = withRateLimit({ max: 2, window: '15m' })(async () => Response.json({ ok: true }));
    const res = await handler(reqFrom('1.1.1.1'), ctx);
    expect(res.status).toBe(200);
  });

  it('returns 429 with a Retry-After header once the limit is exceeded', async () => {
    const handler = withRateLimit({ max: 1, window: '15m' })(async () => Response.json({ ok: true }));
    const ip = '2.2.2.2';

    const first = await handler(reqFrom(ip), ctx);
    expect(first.status).toBe(200);

    const second = await handler(reqFrom(ip), ctx);
    expect(second.status).toBe(429);

    const retryAfter = Number(second.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(15 * 60);

    const body = (await second.json()) as { error: { code: string; message: string } };
    expect(body.error.code).toBe('RATE_LIMITED');
  });

  it('rate limits per IP, not globally', async () => {
    const handler = withRateLimit({ max: 1, window: '15m' })(async () => Response.json({ ok: true }));

    const a1 = await handler(reqFrom('3.3.3.1'), ctx);
    const b1 = await handler(reqFrom('3.3.3.2'), ctx);

    expect(a1.status).toBe(200);
    expect(b1.status).toBe(200);
  });
});
