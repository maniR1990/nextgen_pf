/**
 * v1 response envelope: { ok, data, meta: { requestId, timestamp, version } }
 * All v1 routes use these helpers — never the legacy ok()/error() from response.ts.
 */

import type { PaginationMeta } from '@/lib/api/response';

function makeRequestId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

function baseMeta(requestId = makeRequestId()) {
  return { requestId, timestamp: new Date().toISOString(), version: 'v1' as const };
}

// ── Success ──────────────────────────────────────────────────────────────────

export function v1Ok(data: unknown, status = 200) {
  return Response.json({ ok: true, data, meta: baseMeta() }, { status });
}

export function v1OkMeta(
  data: unknown,
  extra: Record<string, unknown> | PaginationMeta,
  status = 200,
) {
  return Response.json({ ok: true, data, meta: { ...baseMeta(), ...extra } }, { status });
}

export function v1Created(data: unknown) {
  return v1Ok(data, 201);
}

export function v1NoContent() {
  return new Response(null, { status: 204 });
}

export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export function v1Paginated(data: unknown[], cursor: CursorMeta) {
  return Response.json({
    ok: true,
    data,
    meta: { ...baseMeta(), ...cursor },
  });
}

// ── Error ────────────────────────────────────────────────────────────────────

export interface V1ErrorPayload {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export function v1Error(payload: V1ErrorPayload, status: number, headers?: Record<string, string>) {
  return Response.json(
    { ok: false, data: null, error: payload, meta: baseMeta() },
    { status, headers },
  );
}

// ── Guard ────────────────────────────────────────────────────────────────────

export function v1FromApiError(err: {
  message: string;
  status: number;
  code: string;
  headers?: Record<string, string>;
}) {
  return v1Error({ code: err.code, message: err.message }, err.status, err.headers);
}
