import { asRouteHandler } from '@/lib/api/middleware';
import { v1PatchBalance } from '@/modules/accounts';

export const PATCH = asRouteHandler(v1PatchBalance);
