import { Role } from '@prisma/client';
import { compose, withAuth, withRateLimit, withRole, withValidation } from '@/lib/api/middleware';
import { parsePagination } from '@/lib/api/pagination';
import { created, error, ok, paginated } from '@/lib/api/response';
import { isApiError } from '@/lib/api/errors';
import { CreateUserSchema, UpdateUserSchema } from './users.schema';
import { UserService } from './users.service';

export const handleGetUsers = compose(
  withAuth(),
  withRole(Role.ADMIN),
  withRateLimit({ max: 100, window: '1m' }),
)(async (req) => {
  try {
    const url = new URL(req.url);
    const pagination = parsePagination(url);
    const { data, meta } = await UserService.getUsers(pagination);
    return paginated(data, meta);
  } catch (err) {
    if (isApiError(err)) return error(err);
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
    return created(user);
  } catch (err) {
    if (isApiError(err)) return error(err);
    throw err;
  }
});

export const handleGetUser = compose(withAuth())(async (_req, ctx) => {
  try {
    const user = await UserService.getUserById(ctx.params!.id);
    return ok(user);
  } catch (err) {
    if (isApiError(err)) return error(err);
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
    return ok(user);
  } catch (err) {
    if (isApiError(err)) return error(err);
    throw err;
  }
});

export const handleDeleteUser = compose(withAuth(), withRole(Role.ADMIN))(async (_req, ctx) => {
  try {
    await UserService.deleteUser(ctx.params!.id);
    return ok({ deleted: true });
  } catch (err) {
    if (isApiError(err)) return error(err);
    throw err;
  }
});
