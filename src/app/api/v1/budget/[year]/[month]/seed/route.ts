import { isApiError } from '@/lib/api/errors';
import { asRouteHandler } from '@/lib/api/middleware';
import { compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { BudgetEngineService } from '@/modules/budget-engine/budget-engine.service';

const handler = compose(withAuth())(async (_req, ctx) => {
  try {
    const year = Number(ctx.params?.year);
    const month = Number(ctx.params?.month);
    const result = await BudgetEngineService.seedRecurring(ctx.session!.id, year, month);
    return v1Ok(result);
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const POST = asRouteHandler(handler);
