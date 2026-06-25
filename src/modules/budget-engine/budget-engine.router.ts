import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { isApiError } from '@/lib/api/errors';
import { v1Ok, v1FromApiError } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { BudgetImpactSchema, UpdateCategoryPlannedSchema } from './budget-engine.schema';
import { BudgetEngineService } from './budget-engine.service';

const log = getLogger('BudgetEngineRouter');

export const v1GetMonthlySummary = compose(withAuth())(async (req, ctx) => {
  try {
    const year = Number(ctx.params?.year);
    const month = Number(ctx.params?.month);
    const result = await BudgetEngineService.getMonthlySummary(ctx.session!.id, year, month);
    return v1Ok(result);
  } catch (err) {
    log.error('v1GetMonthlySummary', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetBudgetImpact = compose(
  withAuth(),
  withValidation(BudgetImpactSchema),
)(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = BudgetImpactSchema.parse(body);
    const result = await BudgetEngineService.getImpact(ctx.session!.id, parsed);
    return v1Ok(result);
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetCategoryBudgets = compose(withAuth())(async (req, ctx) => {
  try {
    const year = Number(ctx.params?.year);
    const month = Number(ctx.params?.month);
    const result = await BudgetEngineService.getCategoryBudgets(ctx.session!.id, year, month);
    return v1Ok(result);
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateCategoryPlanned = compose(
  withAuth(),
  withValidation(UpdateCategoryPlannedSchema),
)(async (req, ctx) => {
  try {
    const year = Number(ctx.params?.year);
    const month = Number(ctx.params?.month);
    const catId = ctx.params?.catId;
    if (!catId) return v1FromApiError({ message: 'Missing catId', status: 400, code: 'VALIDATION_ERROR' });

    const { planned } = await req.json();
    const result = await BudgetEngineService.updateCategoryPlanned(ctx.session!.id, year, month, catId, planned);
    return v1Ok(result);
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
