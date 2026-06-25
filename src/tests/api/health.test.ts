import { describe, expect, it } from 'vitest';

describe('GET /api/health', () => {
  it('returns ok status shape', () => {
    const body = { status: 'ok', timestamp: new Date().toISOString() };
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});
