import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreatePaymentSource, v1ListPaymentSources } from '@/modules/payment-sources';

export const GET = asRouteHandler(v1ListPaymentSources);
export const POST = asRouteHandler(v1CreatePaymentSource);
