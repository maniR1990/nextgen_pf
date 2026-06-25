export interface ClientApiError {
  message: string;
  code?: string;
  details?: {
    attemptsRemaining?: number;
  };
}

export async function parseClientError(res: Response): Promise<ClientApiError> {
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    code?: string;
    details?: ClientApiError['details'];
  };

  return {
    message: data.error ?? 'Request failed',
    code: data.code,
    details: data.details,
  };
}
