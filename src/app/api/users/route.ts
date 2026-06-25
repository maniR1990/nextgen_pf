import { asRouteHandler } from '@/lib/api/middleware';
import { handleCreateUser, handleGetUsers } from '@/modules/users';

export const GET = asRouteHandler(handleGetUsers);
export const POST = asRouteHandler(handleCreateUser);
