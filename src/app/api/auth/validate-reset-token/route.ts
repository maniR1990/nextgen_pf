import { asRouteHandler } from '@/lib/api/middleware';
import { handleValidateResetToken } from '@/modules/auth';

export const GET = asRouteHandler(handleValidateResetToken);
