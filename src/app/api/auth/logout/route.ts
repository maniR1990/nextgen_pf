import { asRouteHandler } from '@/lib/api/middleware';
import { handleLogout } from '@/modules/auth';

export const POST = asRouteHandler(handleLogout);
