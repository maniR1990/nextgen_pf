import { asRouteHandler } from '@/lib/api/middleware';
import { v1DeleteTransaction, v1GetTransaction, v1PatchTransaction } from '@/modules/transactions';

export const GET = asRouteHandler(v1GetTransaction);
export const PATCH = asRouteHandler(v1PatchTransaction);
export const DELETE = asRouteHandler(v1DeleteTransaction);
