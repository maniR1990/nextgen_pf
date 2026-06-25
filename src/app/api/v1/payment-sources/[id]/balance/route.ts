import { asRouteHandler } from '@/lib/api/middleware';
import { v1UpdateBalance } from '@/modules/payment-sources';

export const PATCH = asRouteHandler(v1UpdateBalance);
