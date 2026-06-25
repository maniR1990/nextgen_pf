import { asRouteHandler } from '@/lib/api/middleware';
import { v1CreateAttachment, v1ListAttachments } from '@/modules/attachments';

export const GET = asRouteHandler(v1ListAttachments);
export const POST = asRouteHandler(v1CreateAttachment);
