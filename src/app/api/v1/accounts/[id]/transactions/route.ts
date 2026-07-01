import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetAccountTransactions } from '@/modules/accounts';

export const GET = asRouteHandler(v1GetAccountTransactions);
