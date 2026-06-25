import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateTemplate, v1ListTemplates } from '@/modules/recurring-templates';

export const GET = asRouteHandler(v1ListTemplates);
export const POST = asRouteHandler(v1CreateTemplate);
