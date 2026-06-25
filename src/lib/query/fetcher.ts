export interface V1Envelope<T> {
  ok: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

type ApiJson<T> = V1Envelope<T> & {
  success?: boolean;
  error?: { message?: string } | string;
};

function getApiErrorMessage(json: ApiJson<unknown>): string {
  if (typeof json.error === 'string') return json.error;
  if (json.error?.message) return json.error.message;
  return 'Request failed';
}

export async function readV1Json<T>(res: Response): Promise<T> {
  const json = (await res.json()) as ApiJson<T>;
  const failed = !res.ok || json.ok === false || json.success === false;
  if (failed) {
    throw new Error(getApiErrorMessage(json));
  }
  return json.data;
}

async function fetchWithSession(path: string, init?: RequestInit): Promise<Response> {
  const options: RequestInit = { credentials: 'include', ...init };
  const res = await fetch(path, options);
  if (res.status !== 401) return res;

  const refreshed = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!refreshed.ok) {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    window.dispatchEvent(new CustomEvent('auth:session-expired'));
    return res;
  }

  return fetch(path, options);
}

export async function apiGetV1<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchWithSession(path, init);
  return readV1Json<T>(res);
}

export function getFetchErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

async function apiWriteV1<T>(
  path: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetchWithSession(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return readV1Json<T>(res);
}

export function apiPostV1<T>(path: string, body: unknown): Promise<T> {
  return apiWriteV1<T>(path, 'POST', body);
}

export function apiPutV1<T>(path: string, body: unknown): Promise<T> {
  return apiWriteV1<T>(path, 'PUT', body);
}

export function apiPatchV1<T>(path: string, body?: unknown): Promise<T> {
  return apiWriteV1<T>(path, 'PATCH', body);
}

export function apiDeleteV1<T>(path: string): Promise<T> {
  return apiWriteV1<T>(path, 'DELETE');
}
