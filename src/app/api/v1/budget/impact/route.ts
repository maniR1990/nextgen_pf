import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetBudgetImpact } from '@/modules/budget-engine';

export const POST = asRouteHandler(v1GetBudgetImpact);
