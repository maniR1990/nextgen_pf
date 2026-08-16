import { asRouteHandler } from '@/lib/api/middleware';
import { v1CloseProject } from '@/modules/projects';

export const POST = asRouteHandler(v1CloseProject);
