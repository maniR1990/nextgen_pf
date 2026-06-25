import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { CreateAttachmentSchema } from './attachments.schema';
import { AttachmentsService } from './attachments.service';

const log = getLogger('AttachmentsRouter');

export const v1CreateAttachment = compose(
  withAuth(),
  withValidation(CreateAttachmentSchema),
)(async (req, ctx) => {
  try {
    const txId = ctx.params?.id;
    if (!txId)
      return v1FromApiError({
        message: 'Missing transaction id',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    const dto = CreateAttachmentSchema.parse(await req.json());
    const attachment = await AttachmentsService.create(txId, ctx.session!.id, dto);
    return v1Created(attachment);
  } catch (err) {
    log.error('v1CreateAttachment', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1ListAttachments = compose(withAuth())(async (_req, ctx) => {
  try {
    const txId = ctx.params?.id;
    if (!txId)
      return v1FromApiError({
        message: 'Missing transaction id',
        status: 400,
        code: 'VALIDATION_ERROR',
      });
    const rows = await AttachmentsService.list(txId, ctx.session!.id);
    return v1Ok(rows);
  } catch (err) {
    log.error('v1ListAttachments', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1DeleteAttachment = compose(withAuth())(async (_req, ctx) => {
  try {
    const txId = ctx.params?.id;
    const attachmentId = ctx.params?.attachmentId;
    if (!txId || !attachmentId)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const result = await AttachmentsService.remove(txId, ctx.session!.id, attachmentId);
    return v1Ok(result);
  } catch (err) {
    log.error('v1DeleteAttachment', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
