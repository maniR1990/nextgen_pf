import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateTransaction, v1ListTransactions } from '@/modules/transactions';

export const GET = asRouteHandler(v1ListTransactions);
export const POST = asRouteHandler(v1CreateTransaction);
