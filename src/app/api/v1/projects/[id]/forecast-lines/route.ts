import { asRouteHandler } from '@/lib/api/middleware';
import { v1AddForecastLine } from '@/modules/projects';

export const POST = asRouteHandler(v1AddForecastLine);
