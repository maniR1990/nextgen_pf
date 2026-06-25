import { ValidationError, isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { created, error, ok } from '@/lib/api/response';
import { CreateBudgetLineSchema, UpdateBudgetLineSchema } from './budget.schema';
import { BudgetService } from './budget.service';

export const handleGetBudgetLedger = compose(withAuth())(async (_req, ctx) => {
  try {
    const data = await BudgetService.getLedger(ctx.session!.id);
    return ok(data);
  } catch (err) {
    if (isApiError(err)) return error(err);
    throw err;
  }
});

export const handleCreateBudgetLine = compose(
  withAuth(),
  withValidation(CreateBudgetLineSchema),
)(async (req, ctx) => {
  try {
    const body = await req.json();
    const line = await BudgetService.createLine(ctx.session!.id, body);
    return created(line);
  } catch (err) {
    if (isApiError(err)) return error(err);
    throw err;
  }
});

export const handleUpdateBudgetLine = compose(
  withAuth(),
  withValidation(UpdateBudgetLineSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return error(new ValidationError('Missing id'));
    const body = await req.json();
    const line = await BudgetService.updateLine(ctx.session!.id, id, body);
    return ok(line);
  } catch (err) {
    if (isApiError(err)) return error(err);
    throw err;
  }
});

export const handleDeleteBudgetLine = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return error(new ValidationError('Missing id'));
    await BudgetService.deleteLine(ctx.session!.id, id);
    return ok({ deleted: true });
  } catch (err) {
    if (isApiError(err)) return error(err);
    throw err;
  }
});
