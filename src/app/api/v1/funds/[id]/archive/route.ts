import { asRouteHandler } from '@/lib/api/middleware';
import { v1ArchiveFund } from '@/modules/funds';

export const PATCH = asRouteHandler(v1ArchiveFund);
