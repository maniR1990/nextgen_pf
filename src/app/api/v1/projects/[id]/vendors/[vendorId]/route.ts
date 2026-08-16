import { asRouteHandler } from '@/lib/api/middleware';
import { v1RemoveVendor, v1UpdateVendor } from '@/modules/projects';

export const PUT = asRouteHandler(v1UpdateVendor);
export const DELETE = asRouteHandler(v1RemoveVendor);
