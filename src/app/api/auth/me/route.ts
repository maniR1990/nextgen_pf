import { asRouteHandler, compose, withAuth } from '@/lib/api/middleware';
import { handleMe } from '@/modules/auth';

export const GET = asRouteHandler(compose(withAuth())(handleMe));
