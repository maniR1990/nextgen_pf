import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { isApiError } from '@/lib/api/errors';
import { v1Ok, v1Created, v1Paginated, v1FromApiError } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { CreatePaymentSourceSchema, UpdateBalanceSchema, StatementQuerySchema } from './payment-sources.schema';
import { PaymentSourcesService } from './payment-sources.service';

const log = getLogger('PaymentSourcesRouter');

export const v1CreatePaymentSource = compose(
  withAuth(),
  withValidation(CreatePaymentSourceSchema),
)(async (req, ctx) => {
  try {
    const body = await req.json();
    const dto = CreatePaymentSourceSchema.parse(body);
    const result = await PaymentSourcesService.create(ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1CreatePaymentSource', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1ListPaymentSources = compose(withAuth())(async (_req, ctx) => {
  try {
    const rows = await PaymentSourcesService.list(ctx.session!.id);
    return v1Ok(rows);
  } catch (err) {
    log.error('v1ListPaymentSources', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateBalance = compose(
  withAuth(),
  withValidation(UpdateBalanceSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const { balance } = UpdateBalanceSchema.parse(await req.json());
    const result = await PaymentSourcesService.updateBalance(id, ctx.session!.id, balance);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateBalance', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetStatement = compose(withAuth())(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const url = new URL(req.url);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const parsed = StatementQuerySchema.parse({ cursor, limit });
    const { rows, hasMore, nextCursor, limit: lim } = await PaymentSourcesService.getStatement(
      id,
      ctx.session!.id,
      { limit: parsed.limit, cursor: parsed.cursor },
    );
    return v1Paginated(rows, { nextCursor, hasMore, limit: lim });
  } catch (err) {
    log.error('v1GetStatement', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
