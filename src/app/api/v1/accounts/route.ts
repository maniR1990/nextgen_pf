import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateAccount, v1ListAccounts } from '@/modules/accounts';

export const GET = asRouteHandler(v1ListAccounts);
export const POST = asRouteHandler(v1CreateAccount);
