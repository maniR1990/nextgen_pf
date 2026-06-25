import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { isApiError } from '@/lib/api/errors';
import { v1Created, v1FromApiError, v1Ok, v1OkMeta } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import {
  CreateAccountSchema,
  ListAccountsQuerySchema,
  PatchBalanceSchema,
  TransferAccountSchema,
  UpdateAccountSchema,
} from './accounts.schema';
import { AccountsService } from './accounts.service';

const log = getLogger('AccountsRouter');

function missingId() {
  return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
}

export const v1ListAccounts = compose(withAuth())(async (req, ctx) => {
  try {
    const url = new URL(req.url);
    const query = ListAccountsQuerySchema.parse(Object.fromEntries(url.searchParams));
    const { data, meta } = await AccountsService.list(ctx.session!.id, query);
    return v1OkMeta(data, meta);
  } catch (err) {
    log.error('v1ListAccounts', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateAccount = compose(
  withAuth(),
  withValidation(CreateAccountSchema),
)(async (req, ctx) => {
  try {
    const dto = CreateAccountSchema.parse(await req.json());
    const result = await AccountsService.create(ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1CreateAccount', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetAccount = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await AccountsService.getById(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1GetAccount', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateAccount = compose(
  withAuth(),
  withValidation(UpdateAccountSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = UpdateAccountSchema.parse(await req.json());
    const result = await AccountsService.update(id, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateAccount', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1PatchBalance = compose(
  withAuth(),
  withValidation(PatchBalanceSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const { balance, note, date } = PatchBalanceSchema.parse(await req.json());
    const result = await AccountsService.patchBalance(id, ctx.session!.id, balance, { note, date });
    return v1Ok(result);
  } catch (err) {
    log.error('v1PatchBalance', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1DeleteAccount = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    await AccountsService.deleteById(id, ctx.session!.id);
    return v1Ok({ deleted: true });
  } catch (err) {
    log.error('v1DeleteAccount', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1ArchiveAccount = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await AccountsService.archive(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1ArchiveAccount', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1TransferAccount = compose(
  withAuth(),
  withValidation(TransferAccountSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = TransferAccountSchema.parse(await req.json());
    const result = await AccountsService.transfer(id, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1TransferAccount', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetAccountHealth = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await AccountsService.getHealth(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1GetAccountHealth', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
