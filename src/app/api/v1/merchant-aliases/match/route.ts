import { asRouteHandler } from '@/lib/api/middleware';
import { v1MatchMerchant } from '@/modules/merchant-aliases';

export const POST = asRouteHandler(v1MatchMerchant);
