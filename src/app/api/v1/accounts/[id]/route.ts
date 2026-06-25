import { asRouteHandler } from '@/lib/api/middleware';
import { v1DeleteAccount, v1GetAccount, v1UpdateAccount } from '@/modules/accounts';

export const GET = asRouteHandler(v1GetAccount);
export const PUT = asRouteHandler(v1UpdateAccount);
export const DELETE = asRouteHandler(v1DeleteAccount);
