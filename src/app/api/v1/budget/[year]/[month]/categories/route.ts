import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetMonthlySummary } from '@/modules/budget-engine';

// Returns the full monthly budget summary (groups + categories)
export const GET = asRouteHandler(v1GetMonthlySummary);
