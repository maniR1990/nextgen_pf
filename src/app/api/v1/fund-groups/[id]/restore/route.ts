import { asRouteHandler } from '@/lib/api/middleware';
import { v1RestoreFundGroup } from '@/modules/fund-groups';

export const POST = asRouteHandler(v1RestoreFundGroup);
