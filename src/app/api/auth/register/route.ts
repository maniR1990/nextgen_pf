import { asRouteHandler } from '@/lib/api/middleware';
import { handleRegister } from '@/modules/auth';

export const POST = asRouteHandler(handleRegister);
