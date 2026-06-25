import { asRouteHandler } from '@/lib/api/middleware';
import { v1PreviewOccurrences } from '@/modules/recurring-templates';

export const POST = asRouteHandler(v1PreviewOccurrences);
