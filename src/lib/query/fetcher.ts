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
  // 204 No Content and any response with no body — treat as success with no data
  const contentType = res.headers.get('content-type') ?? '';
  const hasBody = contentType.includes('application/json') || res.status !== 204;

  if (!res.ok) {
    if (hasBody) {
      try {
        const errJson = (await res.json()) as ApiJson<T>;
        const msg = getApiErrorMessage(errJson);
        throw new Error(msg);
      } catch (parseErr) {
        if (parseErr instanceof Error && !parseErr.message.startsWith('Request failed')) {
          throw parseErr;
        }
      }
    }
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  if (!hasBody) return undefined as T;

  const text = await res.text();
  if (!text.trim()) return undefined as T;

  const json = JSON.parse(text) as ApiJson<T>;
  if (json.ok === false || json.success === false) {
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
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const baseHeaders: Record<string, string> =
    body !== undefined ? { 'Content-Type': 'application/json' } : {};
  const res = await fetchWithSession(path, {
    method,
    headers: { ...baseHeaders, ...extraHeaders },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return readV1Json<T>(res);
}

export function apiPostV1<T>(
  path: string,
  body: unknown,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  return apiWriteV1<T>(path, 'POST', body, extraHeaders);
}

export function apiPutV1<T>(path: string, body: unknown): Promise<T> {
  return apiWriteV1<T>(path, 'PUT', body);
}

export function apiPatchV1<T>(path: string, body?: unknown): Promise<T> {
  return apiWriteV1<T>(path, 'PATCH', body);
}

export function apiDeleteV1<T>(path: string, extraHeaders?: Record<string, string>): Promise<T> {
  return apiWriteV1<T>(path, 'DELETE', undefined, extraHeaders);
}
