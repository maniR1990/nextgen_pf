import { asRouteHandler } from '@/lib/api/middleware';
import { v1ListTransactions, v1CreateTransaction } from '@/modules/transactions';

export const GET = asRouteHandler(v1ListTransactions);
export const POST = asRouteHandler(v1CreateTransaction);
