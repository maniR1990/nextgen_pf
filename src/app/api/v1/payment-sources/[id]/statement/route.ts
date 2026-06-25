import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetStatement } from '@/modules/payment-sources';

export const GET = asRouteHandler(v1GetStatement);
