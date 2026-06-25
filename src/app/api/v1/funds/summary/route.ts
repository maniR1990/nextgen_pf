import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetFundsSummary } from '@/modules/funds';

export const GET = asRouteHandler(v1GetFundsSummary);
