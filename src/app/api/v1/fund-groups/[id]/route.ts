import { asRouteHandler } from '@/lib/api/middleware';
import { v1DeleteFundGroup, v1UpdateFundGroup } from '@/modules/fund-groups';

export const PATCH = asRouteHandler(v1UpdateFundGroup);
export const DELETE = asRouteHandler(v1DeleteFundGroup);
