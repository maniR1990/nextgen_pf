import { asRouteHandler } from '@/lib/api/middleware';
import { v1ReopenProject } from '@/modules/projects';

export const POST = asRouteHandler(v1ReopenProject);
