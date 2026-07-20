import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGetV1, fetchWithSession } from './fetcher';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('fetchWithSession', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('dispatchEvent', vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it('passes through a normal successful response untouched', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { id: '1' } }));

    const res = await fetchWithSession('/api/v1/thing');

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('on a 401, refreshes the session and retries the original request once', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { ok: false }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { id: '1' } }));

    const res = await fetchWithSession('/api/v1/thing');

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh');
    expect(fetchMock.mock.calls[2][0]).toBe('/api/v1/thing');
  });

  it('when refresh fails, logs out and dispatches auth:session-expired instead of retrying', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { ok: false }))
      .mockResolvedValueOnce(jsonResponse(401, { ok: false }))
      .mockResolvedValueOnce(jsonResponse(200, {}));

    const res = await fetchWithSession('/api/v1/thing');

    expect(res.status).toBe(401);
    expect(fetchMock.mock.calls[2][0]).toBe('/api/auth/logout');
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'auth:session-expired' }));
  });

  it('always sends credentials so the session cookie is included', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true, data: {} }));
    await fetchWithSession('/api/v1/thing');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
  });
});

describe('apiGetV1', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('unwraps the v1 envelope and returns just the data', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { id: '1' } }));
    const result = await apiGetV1<{ id: string }>('/api/v1/thing');
    expect(result).toEqual({ id: '1' });
  });

  it('goes through the same session-recovery path as fetchWithSession on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(401, { ok: false }))
      .mockResolvedValueOnce(jsonResponse(200, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true, data: { id: 'recovered' } }));

    const result = await apiGetV1<{ id: string }>('/api/v1/thing');

    expect(result).toEqual({ id: 'recovered' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
