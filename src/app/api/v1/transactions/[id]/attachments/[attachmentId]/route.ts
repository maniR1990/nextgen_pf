import { asRouteHandler } from '@/lib/api/middleware';
import { v1DeleteAttachment } from '@/modules/attachments';

export const DELETE = asRouteHandler(v1DeleteAttachment);
