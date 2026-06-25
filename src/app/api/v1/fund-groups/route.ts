import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateFundGroup, v1ListFundGroups } from '@/modules/fund-groups';

export const GET = asRouteHandler(v1ListFundGroups);
export const POST = asRouteHandler(v1CreateFundGroup);
