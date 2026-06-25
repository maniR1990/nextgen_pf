import { asRouteHandler } from '@/lib/api/middleware';
import { handleResendVerification } from '@/modules/auth';

export const POST = asRouteHandler(handleResendVerification);
