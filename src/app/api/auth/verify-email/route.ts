import { asRouteHandler } from '@/lib/api/middleware';
import { handleVerifyEmail } from '@/modules/auth';

export const GET = asRouteHandler(handleVerifyEmail);
