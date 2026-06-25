import { asRouteHandler } from '@/lib/api/middleware';
import { v1SetupDefaultFunds } from '@/modules/funds';

export const POST = asRouteHandler(v1SetupDefaultFunds);
