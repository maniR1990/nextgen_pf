import { asRouteHandler } from '@/lib/api/middleware';
import { v1AllocateFund, v1SaveFundAllocations } from '@/modules/funds';

export const POST = asRouteHandler(v1SaveFundAllocations);
export const PATCH = asRouteHandler(v1AllocateFund);
