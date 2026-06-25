import { asRouteHandler } from '@/lib/api/middleware';
import { v1VoidTransaction } from '@/modules/transactions';

export const POST = asRouteHandler(v1VoidTransaction);
