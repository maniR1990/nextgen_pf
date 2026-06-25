import { asRouteHandler } from '@/lib/api/middleware';
import { v1GetCategoryStats } from '@/modules/categories';

export const GET = asRouteHandler(v1GetCategoryStats);
