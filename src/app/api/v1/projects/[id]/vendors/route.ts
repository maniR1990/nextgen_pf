import { asRouteHandler } from '@/lib/api/middleware';
import { v1AddVendor } from '@/modules/projects';

export const POST = asRouteHandler(v1AddVendor);
