import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateFund, v1ListFunds } from '@/modules/funds';

export const GET = asRouteHandler(v1ListFunds);
export const POST = asRouteHandler(v1CreateFund);
