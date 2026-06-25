import { asRouteHandler } from '@/lib/api/middleware';
import { v1ReorderCategories } from '@/modules/categories';

export const PATCH = asRouteHandler(v1ReorderCategories);
