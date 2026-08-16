import { asRouteHandler } from '@/lib/api/middleware';
import { v1DeleteProject, v1GetProject, v1UpdateProject } from '@/modules/projects';

export const GET = asRouteHandler(v1GetProject);
export const PUT = asRouteHandler(v1UpdateProject);
export const DELETE = asRouteHandler(v1DeleteProject);
