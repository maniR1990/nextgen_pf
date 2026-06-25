import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok, v1OkMeta } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import {
  AllocateFundSchema,
  CreateFundSchema,
  ListFundsQuerySchema,
  SaveAllocationsSchema,
  UpdateFundSchema,
} from './funds.schema';
import { FundsService } from './funds.service';

const log = getLogger('FundsRouter');

function missingId() {
  return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
}

export const v1ListFunds = compose(withAuth())(async (req, ctx) => {
  try {
    const url = new URL(req.url);
    const query = ListFundsQuerySchema.parse(Object.fromEntries(url.searchParams));
    const { data, meta } = await FundsService.list(ctx.session!.id, query);
    return v1OkMeta(data, meta);
  } catch (err) {
    log.error('v1ListFunds', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateFund = compose(
  withAuth(),
  withValidation(CreateFundSchema),
)(async (req, ctx) => {
  try {
    const dto = CreateFundSchema.parse(await req.json());
    const result = await FundsService.create(ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1CreateFund', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetFund = compose(withAuth())(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await FundsService.get(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1GetFund', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1ArchiveFund = compose(withAuth())(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    await FundsService.archive(id, ctx.session!.id);
    return v1Ok({ archived: true });
  } catch (err) {
    log.error('v1ArchiveFund', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1DeleteFund = compose(withAuth())(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    await FundsService.hardDelete(id, ctx.session!.id);
    return v1Ok({ deleted: true });
  } catch (err) {
    log.error('v1DeleteFund', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateFund = compose(
  withAuth(),
  withValidation(UpdateFundSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = UpdateFundSchema.parse(await req.json());
    const result = await FundsService.update(id, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateFund', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1AllocateFund = compose(
  withAuth(),
  withValidation(AllocateFundSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = AllocateFundSchema.parse(await req.json());
    const result = await FundsService.allocate(id, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1AllocateFund', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1SaveFundAllocations = compose(
  withAuth(),
  withValidation(SaveAllocationsSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const { sources } = SaveAllocationsSchema.parse(await req.json());
    const result = await FundsService.saveAllocations(id, ctx.session!.id, sources);
    return v1Ok(result);
  } catch (err) {
    log.error('v1SaveFundAllocations', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1RemoveFundAllocation = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    const accountId = ctx.params?.accountId;
    if (!id || !accountId) {
      return v1FromApiError({
        message: 'Missing id or accountId',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    }
    const result = await FundsService.removeAllocation(id, ctx.session!.id, accountId);
    return v1Ok(result);
  } catch (err) {
    log.error('v1RemoveFundAllocation', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetFundsSummary = compose(withAuth())(async (_req, ctx) => {
  try {
    const result = await FundsService.getSummary(ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1GetFundsSummary', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1SetupDefaultFunds = compose(withAuth())(async (_req, ctx) => {
  try {
    const result = await FundsService.setupDefaults(ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1SetupDefaultFunds', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
