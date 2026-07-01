import { asRouteHandler } from '@/lib/api/middleware';
import { handleRefresh } from '@/modules/auth';

export const POST = asRouteHandler(handleRefresh);
