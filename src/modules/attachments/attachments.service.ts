import {
  NotFoundError,
  FileTooLargeError,
  UnsupportedFileTypeError,
  AttachmentLimitError,
} from '@/lib/api/errors';
import { getLogger } from '@/lib/logger';
import { AttachmentsRepository } from './attachments.repository';

const log = getLogger('AttachmentsService');

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PER_TX = 5;
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
]);

function assertOwned(tx: { userId: string }, userId: string) {
  if (tx.userId !== userId) throw new NotFoundError('Transaction not found');
}

export interface CreateAttachmentDto {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export const AttachmentsService = {
  async create(txId: string, userId: string, dto: CreateAttachmentDto) {
    const tx = await AttachmentsRepository.findTransaction(txId);
    assertOwned(tx, userId);

    if (dto.sizeBytes > MAX_SIZE_BYTES) throw new FileTooLargeError();
    if (!ALLOWED_MIME.has(dto.mimeType)) throw new UnsupportedFileTypeError();

    const count = await AttachmentsRepository.countByTxId(txId);
    if (count >= MAX_PER_TX) throw new AttachmentLimitError();

    log.info('create attachment', { txId, filename: dto.filename });
    return AttachmentsRepository.create({ txId, ...dto });
  },

  async list(txId: string, userId: string) {
    const tx = await AttachmentsRepository.findTransaction(txId);
    assertOwned(tx, userId);
    return AttachmentsRepository.findByTxId(txId);
  },

  async remove(txId: string, userId: string, attachmentId: string) {
    const tx = await AttachmentsRepository.findTransaction(txId);
    assertOwned(tx, userId);
    // verify the attachment belongs to this tx
    await AttachmentsRepository.findByIdAndTxId(attachmentId, txId);
    log.info('soft-delete attachment', { attachmentId });
    return AttachmentsRepository.softDelete(attachmentId);
  },
};
