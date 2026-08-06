export interface ClientApiError {
  message: string;
  code?: string;
  details?: {
    attemptsRemaining?: number;
  };
  /** Seconds until the request can succeed again, from the Retry-After header (rate limits). */
  retryAfterSec?: number;
}

export async function parseClientError(res: Response): Promise<ClientApiError> {
  const data = (await res.json().catch(() => ({}))) as {
    error?: string | { code?: string; message?: string; details?: ClientApiError['details'] };
    code?: string;
    details?: ClientApiError['details'];
  };

  const retryAfterHeader = res.headers.get('Retry-After');
  const retryAfterSec = retryAfterHeader ? Number(retryAfterHeader) : undefined;

  if (data.error && typeof data.error === 'object') {
    return {
      message: data.error.message ?? 'Request failed',
      code: data.error.code,
      details: data.error.details,
      retryAfterSec: Number.isFinite(retryAfterSec) ? retryAfterSec : undefined,
    };
  }

  return {
    message: data.error ?? 'Request failed',
    code: data.code,
    details: data.details,
    retryAfterSec: Number.isFinite(retryAfterSec) ? retryAfterSec : undefined,
  };
}
