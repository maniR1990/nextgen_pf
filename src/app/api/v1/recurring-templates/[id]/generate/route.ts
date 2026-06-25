import { asRouteHandler } from '@/lib/api/middleware';
import { v1GenerateOccurrence } from '@/modules/recurring-templates';

export const POST = asRouteHandler(v1GenerateOccurrence);
