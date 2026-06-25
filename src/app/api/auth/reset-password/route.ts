import { asRouteHandler } from '@/lib/api/middleware';
import { handleResetPassword } from '@/modules/auth';

export const POST = asRouteHandler(handleResetPassword);
