import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetAccountHealth } from '@/modules/accounts';

export const GET = asRouteHandler(v1GetAccountHealth);
