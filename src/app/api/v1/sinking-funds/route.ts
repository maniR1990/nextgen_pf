import { asRouteHandler } from '@/lib/api/middleware';
import { v1ListSinkingFunds } from '@/modules/sinking-funds';

export const GET = asRouteHandler(v1ListSinkingFunds);
