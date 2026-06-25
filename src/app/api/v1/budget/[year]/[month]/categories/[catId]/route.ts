import { asRouteHandler } from '@/lib/api/middleware';
import { v1UpdateCategoryPlanned } from '@/modules/budget-engine';

export const PUT = asRouteHandler(v1UpdateCategoryPlanned);
