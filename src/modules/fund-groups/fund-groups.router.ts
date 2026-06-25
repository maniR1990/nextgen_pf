import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { isApiError } from '@/lib/api/errors';
import { v1Created, v1FromApiError, v1NoContent, v1Ok } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { CreateFundGroupSchema, UpdateFundGroupSchema } from './fund-groups.schema';
import { FundGroupsService } from './fund-groups.service';

const log = getLogger('FundGroupsRouter');

function missingId() {
  return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
}

export const v1ListFundGroups = compose(withAuth())(async (req, ctx) => {
  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const result = await FundGroupsService.list(ctx.session!.id, includeArchived);
    return v1Ok(result);
  } catch (err) {
    log.error('v1ListFundGroups', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateFundGroup = compose(withAuth(), withValidation(CreateFundGroupSchema))(
  async (req, ctx) => {
    try {
      const dto = CreateFundGroupSchema.parse(await req.json());
      const result = await FundGroupsService.create(ctx.session!.id, dto);
      return v1Created(result);
    } catch (err) {
      log.error('v1CreateFundGroup', { err });
      if (isApiError(err)) return v1FromApiError(err);
      throw err;
    }
  },
);

export const v1UpdateFundGroup = compose(withAuth(), withValidation(UpdateFundGroupSchema))(
  async (req, ctx) => {
    try {
      const id = ctx.params?.id;
      if (!id) return missingId();
      const dto = UpdateFundGroupSchema.parse(await req.json());
      const result = await FundGroupsService.update(id, ctx.session!.id, dto);
      return v1Ok(result);
    } catch (err) {
      log.error('v1UpdateFundGroup', { err });
      if (isApiError(err)) return v1FromApiError(err);
      throw err;
    }
  },
);

export const v1DeleteFundGroup = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    await FundGroupsService.delete(id, ctx.session!.id);
    return v1NoContent();
  } catch (err) {
    log.error('v1DeleteFundGroup', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1RestoreFundGroup = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    await FundGroupsService.restore(id, ctx.session!.id);
    return v1NoContent();
  } catch (err) {
    log.error('v1RestoreFundGroup', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
