import { asRouteHandler } from '@/lib/api/middleware';
import { handleCreateTransaction, handleGetTransactions } from '@/modules/transactions';

export const GET = asRouteHandler(handleGetTransactions);
export const POST = asRouteHandler(handleCreateTransaction);
