import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetCategoryBudgets } from '@/modules/budget-engine';

export const GET = asRouteHandler(v1GetCategoryBudgets);
