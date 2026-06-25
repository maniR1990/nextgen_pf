import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetIncomePeriod } from '@/modules/transactions/transactions.router';

export const GET = asRouteHandler(v1GetIncomePeriod);
