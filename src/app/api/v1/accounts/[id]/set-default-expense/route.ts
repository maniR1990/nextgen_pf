import { asRouteHandler } from '@/lib/api/middleware';
import { v1SetDefaultExpenseAccount } from '@/modules/accounts';

export const PATCH = asRouteHandler(v1SetDefaultExpenseAccount);
