import { describe, expect, it } from 'vitest';
import { parseClientError } from './parseClientError';

function jsonResponse(status: number, body: unknown, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('parseClientError', () => {
  it('unwraps the v1 envelope error object into a plain string message', async () => {
    const res = jsonResponse(429, {
      ok: false,
      data: null,
      error: { code: 'RATE_LIMITED', message: 'Too many requests' },
    });

    const result = await parseClientError(res);

    expect(result).toEqual({
      message: 'Too many requests',
      code: 'RATE_LIMITED',
      details: undefined,
      retryAfterSec: undefined,
    });
  });

  it('reads retryAfterSec from the Retry-After header on a 429', async () => {
    const res = jsonResponse(
      429,
      { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
      { 'Retry-After': '42' },
    );

    const result = await parseClientError(res);

    expect(result.retryAfterSec).toBe(42);
  });

  it('leaves retryAfterSec undefined when there is no Retry-After header', async () => {
    const res = jsonResponse(400, { error: { code: 'BAD_REQUEST', message: 'Bad request' } });

    const result = await parseClientError(res);

    expect(result.retryAfterSec).toBeUndefined();
  });

  it('carries through details from the v1 envelope error object', async () => {
    const res = jsonResponse(401, {
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password', details: { attemptsRemaining: 2 } },
    });

    const result = await parseClientError(res);

    expect(result.details).toEqual({ attemptsRemaining: 2 });
  });

  it('still supports the legacy string error shape', async () => {
    const res = jsonResponse(400, { error: 'Bad request', code: 'BAD_REQUEST' });

    const result = await parseClientError(res);

    expect(result).toEqual({
      message: 'Bad request',
      code: 'BAD_REQUEST',
      details: undefined,
      retryAfterSec: undefined,
    });
  });

  it('falls back to a generic message when the body is unparseable', async () => {
    const res = new Response('not json', { status: 500 });

    const result = await parseClientError(res);

    expect(result.message).toBe('Request failed');
  });
});
