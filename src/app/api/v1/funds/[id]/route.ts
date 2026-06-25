import { asRouteHandler } from '@/lib/api/middleware';
import { v1DeleteFund, v1GetFund, v1UpdateFund } from '@/modules/funds';

export const GET = asRouteHandler(v1GetFund);
export const PUT = asRouteHandler(v1UpdateFund);
export const DELETE = asRouteHandler(v1DeleteFund);
