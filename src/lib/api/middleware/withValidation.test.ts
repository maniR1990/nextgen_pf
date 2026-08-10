import { z } from 'zod';
import { describe, expect, it } from 'vitest';
import { withValidation } from './withValidation';
import type { RouteContext } from './types';

const ctx: RouteContext = {};
const schema = z.object({ amount: z.number().positive() });

function postReq(body: unknown): Request {
  return new Request('http://localhost/api/v1/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('withValidation', () => {
  it('passes the parsed body through to the handler on valid input', async () => {
    let received: unknown;
    const handler = withValidation(schema)(async (req) => {
      received = await req.json();
      return Response.json({ ok: true });
    });
    const res = await handler(postReq({ amount: 100 }), ctx);
    expect(res.status).toBe(200);
    expect(received).toEqual({ amount: 100 });
  });

  it('returns 422 with issue details when the body fails schema validation', async () => {
    const handler = withValidation(schema)(async () => Response.json({ ok: true }));
    const res = await handler(postReq({ amount: -5 }), ctx);
    expect(res.status).toBe(422);
    const body = (await res.json()) as { success: boolean; code: string };
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when the body is not valid JSON', async () => {
    const handler = withValidation(schema)(async () => Response.json({ ok: true }));
    const badReq = new Request('http://localhost/api/v1/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'not json',
    });
    const res = await handler(badReq, ctx);
    expect(res.status).toBe(422);
  });

  // Regression: `return handler(...)` without `await` inside the try block meant this
  // catch never actually observed a rejection from the downstream handler — a `try {
  // return promise } catch {}` doesn't catch that promise's later rejection. Once the
  // handler call moved outside the try (see withValidation.ts), errors it throws must
  // propagate to the CALLER of this middleware untouched, not get relabeled as a generic
  // 422 "Invalid input" the way they used to.
  it('lets an error thrown by the downstream handler propagate untouched, not relabeled as a validation error', async () => {
    const handler = withValidation(schema)(async () => {
      throw new Error('downstream exploded');
    });
    await expect(handler(postReq({ amount: 100 }), ctx)).rejects.toThrow('downstream exploded');
  });
});
