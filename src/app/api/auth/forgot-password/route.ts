import { asRouteHandler } from '@/lib/api/middleware';
import { handleForgotPassword } from '@/modules/auth';

export const POST = asRouteHandler(handleForgotPassword);
