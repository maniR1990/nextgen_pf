import { asRouteHandler } from '@/lib/api/middleware';
import { v1ListCategories, v1CreateCategory } from '@/modules/categories';

export const GET = asRouteHandler(v1ListCategories);
export const POST = asRouteHandler(v1CreateCategory);
