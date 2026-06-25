import { asRouteHandler } from '@/lib/api/middleware';
import { v1UpdateTemplate } from '@/modules/recurring-templates';

export const PATCH = asRouteHandler(v1UpdateTemplate);
