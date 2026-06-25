import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetNetWorth } from '@/modules/net-worth';

export const GET = asRouteHandler(v1GetNetWorth);
