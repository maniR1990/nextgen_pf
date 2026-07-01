import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withRateLimit, withRole, withValidation } from '@/lib/api/middleware';
import { parsePagination } from '@/lib/api/pagination';
import { v1Created, v1FromApiError, v1Ok, v1OkMeta } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { Role } from '@prisma/client';
import { CreateUserSchema, UpdateUserSchema } from './users.schema';
import { UserService } from './users.service';

const log = getLogger('UsersRouter');

export const handleGetUsers = compose(
  withAuth(),
  withRole(Role.ADMIN),
  withRateLimit({ max: 100, window: '1m' }),
)(async (req) => {
  try {
    const url = new URL(req.url);
    const pagination = parsePagination(url);
    const { data, meta } = await UserService.getUsers(pagination);
    return v1OkMeta(data, meta);
  } catch (err) {
    log.error('getUsers', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleCreateUser = compose(
  withAuth(),
  withRole(Role.ADMIN),
  withValidation(CreateUserSchema),
)(async (req) => {
  try {
    const body = await req.json();
    const user = await UserService.createUser(body);
    return v1Created(user);
  } catch (err) {
    log.error('createUser', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleGetUser = compose(withAuth())(async (_req, ctx) => {
  try {
    const user = await UserService.getUserById(ctx.params!.id);
    return v1Ok(user);
  } catch (err) {
    log.error('getUser', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleUpdateUser = compose(
  withAuth(),
  withRole(Role.ADMIN),
  withValidation(UpdateUserSchema),
)(async (req, ctx) => {
  try {
    const body = await req.json();
    const user = await UserService.updateUser(ctx.params!.id, body);
    return v1Ok(user);
  } catch (err) {
    log.error('updateUser', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleDeleteUser = compose(
  withAuth(),
  withRole(Role.ADMIN),
)(async (_req, ctx) => {
  try {
    await UserService.deleteUser(ctx.params!.id);
    return v1Ok({ deleted: true });
  } catch (err) {
    log.error('deleteUser', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
