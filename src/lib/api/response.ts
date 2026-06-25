import type { ApiError } from './errors';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const ok = (data: unknown, status = 200) =>
  Response.json({ success: true, data }, { status });

export const created = (data: unknown) => ok(data, 201);

export const paginated = (data: unknown[], meta: PaginationMeta) =>
  Response.json({ success: true, data, meta });

export const error = (err: ApiError) =>
  Response.json(
    {
      success: false,
      error: err.message,
      code: err.code,
      ...('details' in err && err.details ? { details: err.details } : {}),
    },
    { status: err.status, headers: err.headers },
  );
