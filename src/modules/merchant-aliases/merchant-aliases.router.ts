import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { CreateMerchantAliasSchema, MatchMerchantSchema } from './merchant-aliases.schema';
import { MerchantAliasesService } from './merchant-aliases.service';

const log = getLogger('MerchantAliasesRouter');

export const v1MatchMerchant = compose(
  withAuth(),
  withValidation(MatchMerchantSchema),
)(async (req, ctx) => {
  try {
    const { merchantName } = MatchMerchantSchema.parse(await req.json());
    const match = await MerchantAliasesService.match(ctx.session!.id, merchantName);
    return v1Ok(match);
  } catch (err) {
    log.error('v1MatchMerchant', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1ListMerchantAliases = compose(withAuth())(async (_req, ctx) => {
  try {
    const rows = await MerchantAliasesService.list(ctx.session!.id);
    return v1Ok(rows);
  } catch (err) {
    log.error('v1ListMerchantAliases', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateMerchantAlias = compose(
  withAuth(),
  withValidation(CreateMerchantAliasSchema),
)(async (req, ctx) => {
  try {
    const dto = CreateMerchantAliasSchema.parse(await req.json());
    const alias = await MerchantAliasesService.create(ctx.session!.id, dto);
    return v1Created(alias);
  } catch (err) {
    log.error('v1CreateMerchantAlias', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
