import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetTransactionsSummary } from '@/modules/transactions';

export const GET = asRouteHandler(v1GetTransactionsSummary);
