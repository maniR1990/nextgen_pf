import { asRouteHandler } from '@/lib/api/middleware';
import { v1AddActivityItem } from '@/modules/projects';

export const POST = asRouteHandler(v1AddActivityItem);
