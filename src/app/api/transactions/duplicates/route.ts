import { asRouteHandler } from '@/lib/api/middleware';
import { handleCheckDuplicates } from '@/modules/transactions/transactions.router';

export const POST = asRouteHandler(handleCheckDuplicates);
