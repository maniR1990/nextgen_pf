import { asRouteHandler } from '@/lib/api/middleware';
import { v1DeleteAccountGroup, v1UpdateAccountGroup } from '@/modules/account-groups';

export const PUT = asRouteHandler(v1UpdateAccountGroup);
export const DELETE = asRouteHandler(v1DeleteAccountGroup);
