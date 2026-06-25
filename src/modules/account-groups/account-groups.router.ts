import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok, v1OkMeta } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import {
  CreateAccountGroupSchema,
  ListAccountGroupsQuerySchema,
  ReorderAccountGroupsSchema,
  UpdateAccountGroupSchema,
} from './account-groups.schema';
import { AccountGroupsService } from './account-groups.service';

const log = getLogger('AccountGroupsRouter');

function missingId() {
  return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
}

export const v1ListAccountGroups = compose(withAuth())(async (req, ctx) => {
  try {
    const url = new URL(req.url);
    const query = ListAccountGroupsQuerySchema.parse(Object.fromEntries(url.searchParams));
    const { data, meta } = await AccountGroupsService.list(ctx.session!.id, query);
    return v1OkMeta(data, meta);
  } catch (err) {
    log.error('v1ListAccountGroups', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateAccountGroup = compose(
  withAuth(),
  withValidation(CreateAccountGroupSchema),
)(async (req, ctx) => {
  try {
    const dto = CreateAccountGroupSchema.parse(await req.json());
    const result = await AccountGroupsService.create(ctx.session!.id, dto);
    return v1Created(result);
  } catch (err) {
    log.error('v1CreateAccountGroup', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1UpdateAccountGroup = compose(
  withAuth(),
  withValidation(UpdateAccountGroupSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const dto = UpdateAccountGroupSchema.parse(await req.json());
    const result = await AccountGroupsService.update(id, ctx.session!.id, dto);
    return v1Ok(result);
  } catch (err) {
    log.error('v1UpdateAccountGroup', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1ReorderAccountGroups = compose(
  withAuth(),
  withValidation(ReorderAccountGroupsSchema),
)(async (req, ctx) => {
  try {
    const items = ReorderAccountGroupsSchema.parse(await req.json());
    const result = await AccountGroupsService.reorder(ctx.session!.id, items);
    return v1Ok(result);
  } catch (err) {
    log.error('v1ReorderAccountGroups', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1DeleteAccountGroup = compose(withAuth())(async (_req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id) return missingId();
    const result = await AccountGroupsService.delete(id, ctx.session!.id);
    return v1Ok(result);
  } catch (err) {
    log.error('v1DeleteAccountGroup', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
