import { asRouteHandler } from '@/lib/api/middleware';
import { handleLogin } from '@/modules/auth';

export const POST = asRouteHandler(handleLogin);
