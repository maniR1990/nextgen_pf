import { asRouteHandler } from '@/lib/api/middleware';
import { v1DeleteCategory, v1GetCategory, v1UpdateCategory } from '@/modules/categories';

export const GET = asRouteHandler(v1GetCategory);
export const PUT = asRouteHandler(v1UpdateCategory);
export const DELETE = asRouteHandler(v1DeleteCategory);
