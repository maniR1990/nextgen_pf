import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateProject, v1ListProjects } from '@/modules/projects';

export const GET = asRouteHandler(v1ListProjects);
export const POST = asRouteHandler(v1CreateProject);
