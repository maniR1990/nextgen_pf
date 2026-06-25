import { asRouteHandler } from '@/lib/api/middleware';
import { handleCreateBudgetLine, handleGetBudgetLedger } from '@/modules/budget';

export const GET = asRouteHandler(handleGetBudgetLedger);
export const POST = asRouteHandler(handleCreateBudgetLine);
