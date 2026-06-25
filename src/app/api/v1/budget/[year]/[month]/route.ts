import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetMonthlySummary } from '@/modules/budget-engine';

export const GET = asRouteHandler(v1GetMonthlySummary);
