import { asRouteHandler } from '@/lib/api/middleware';
import { v1ListTemplates, v1CreateTemplate } from '@/modules/recurring-templates';

export const GET = asRouteHandler(v1ListTemplates);
export const POST = asRouteHandler(v1CreateTemplate);
