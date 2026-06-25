import { asRouteHandler } from '@/lib/api/middleware';
import { v1RemoveFundAllocation } from '@/modules/funds';

export const DELETE = asRouteHandler(v1RemoveFundAllocation);
