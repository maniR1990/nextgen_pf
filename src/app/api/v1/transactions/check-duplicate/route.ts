import { asRouteHandler } from '@/lib/api/middleware';
import { v1CheckDuplicate } from '@/modules/transactions';

export const POST = asRouteHandler(v1CheckDuplicate);
