import { asRouteHandler } from '@/lib/api/middleware';
import { v1ArchiveAccount } from '@/modules/accounts';

export const PATCH = asRouteHandler(v1ArchiveAccount);
