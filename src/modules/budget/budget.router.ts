import { ValidationError, isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { CreateBudgetLineSchema, UpdateBudgetLineSchema } from './budget.schema';
import { BudgetService } from './budget.service';

const log = getLogger('BudgetRouter');

export const handleGetBudgetLedger = compose(withAuth())(async (_req, ctx) => {
  try {
    const data = await BudgetService.getLedger(ctx.session!.id);
    return v1Ok(data);
  } catch (err) {
    log.error('getLedger', { err });
    if (isApiError(err)) return v1FromApiError(err);
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
    return v1Created(line);
  } catch (err) {
    log.error('createLine', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleUpdateBudgetLine = compose(
  withAuth(),
  withValidation(UpdateBudgetLineSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return v1FromApiError(new ValidationError('Missing id'));
    const body = await req.json();
    const line = await BudgetService.updateLine(ctx.session!.id, id, body);
    return v1Ok(line);
  } catch (err) {
    log.error('updateLine', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleDeleteBudgetLine = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return v1FromApiError(new ValidationError('Missing id'));
    await BudgetService.deleteLine(ctx.session!.id, id);
    return v1Ok({ deleted: true });
  } catch (err) {
    log.error('deleteLine', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
