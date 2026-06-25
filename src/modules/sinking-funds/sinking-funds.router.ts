import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { DepositSchema } from './sinking-funds.schema';
import { SinkingFundsService } from './sinking-funds.service';

const log = getLogger('SinkingFundsRouter');

export const v1ListSinkingFunds = compose(withAuth())(async (_req, ctx) => {
  try {
    const rows = await SinkingFundsService.list(ctx.session!.id);
    return v1Ok(rows);
  } catch (err) {
    log.error('v1ListSinkingFunds', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1Deposit = compose(
  withAuth(),
  withValidation(DepositSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const { amount } = DepositSchema.parse(await req.json());
    const result = await SinkingFundsService.deposit(id, ctx.session!.id, amount);
    return v1Ok(result);
  } catch (err) {
    log.error('v1Deposit', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
