import { asRouteHandler } from '@/lib/api/middleware';
import { v1ReorderAccountGroups } from '@/modules/account-groups';

export const PATCH = asRouteHandler(v1ReorderAccountGroups);
