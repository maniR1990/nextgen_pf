import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateBulkTransaction } from '@/modules/transactions';

export const POST = asRouteHandler(v1CreateBulkTransaction);
