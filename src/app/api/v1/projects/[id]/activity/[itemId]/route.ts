import { asRouteHandler } from '@/lib/api/middleware';
import { v1RemoveActivityItem, v1UpdateActivityItem } from '@/modules/projects';

export const PUT = asRouteHandler(v1UpdateActivityItem);
export const DELETE = asRouteHandler(v1RemoveActivityItem);
