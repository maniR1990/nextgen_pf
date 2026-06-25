import { asRouteHandler } from '@/lib/api/middleware';
import { v1ListMerchantAliases, v1CreateMerchantAlias } from '@/modules/merchant-aliases';

export const GET = asRouteHandler(v1ListMerchantAliases);
export const POST = asRouteHandler(v1CreateMerchantAlias);
