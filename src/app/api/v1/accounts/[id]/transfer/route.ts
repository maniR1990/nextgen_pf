import { asRouteHandler } from '@/lib/api/middleware';
import { v1TransferAccount } from '@/modules/accounts';

export const POST = asRouteHandler(v1TransferAccount);
