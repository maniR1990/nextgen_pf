import { asRouteHandler } from '@/lib/api/middleware';
import { v1Deposit } from '@/modules/sinking-funds';

export const POST = asRouteHandler(v1Deposit);
