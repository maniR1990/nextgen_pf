import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetNetWorthHistory } from '@/modules/net-worth';

export const GET = asRouteHandler(v1GetNetWorthHistory);
