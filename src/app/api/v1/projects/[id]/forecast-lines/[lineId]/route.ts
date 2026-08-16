import { asRouteHandler } from '@/lib/api/middleware';
import { v1RemoveForecastLine, v1UpdateForecastLine } from '@/modules/projects';

export const PUT = asRouteHandler(v1UpdateForecastLine);
export const DELETE = asRouteHandler(v1RemoveForecastLine);
