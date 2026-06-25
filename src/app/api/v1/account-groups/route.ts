import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateAccountGroup, v1ListAccountGroups } from '@/modules/account-groups';

export const GET = asRouteHandler(v1ListAccountGroups);
export const POST = asRouteHandler(v1CreateAccountGroup);
