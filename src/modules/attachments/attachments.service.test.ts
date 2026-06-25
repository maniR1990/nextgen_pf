import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AttachmentsService } from './attachments.service';
import { AttachmentsRepository } from './attachments.repository';
import { NotFoundError, FileTooLargeError, UnsupportedFileTypeError, AttachmentLimitError } from '@/lib/api/errors';

vi.mock('./attachments.repository');

const mockTx = { id: 'tx1', userId: 'u1', status: 'PENDING' };
const mockAttachment = {
  id: 'att1',
  txId: 'tx1',
  filename: 'receipt.pdf',
  url: 'https://storage.example.com/receipt.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 102400,
  uploadedAt: new Date(),
  deletedAt: null,
};

beforeEach(() => vi.clearAllMocks());

describe('AttachmentsService.create', () => {
  it('creates an attachment for an owned transaction', async () => {
    vi.mocked(AttachmentsRepository.findTransaction).mockResolvedValue(mockTx as never);
    vi.mocked(AttachmentsRepository.countByTxId).mockResolvedValue(2);
    vi.mocked(AttachmentsRepository.create).mockResolvedValue(mockAttachment as never);

    const result = await AttachmentsService.create('tx1', 'u1', {
      filename: 'receipt.pdf',
      url: 'https://storage.example.com/receipt.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
    });
    expect(result.id).toBe('att1');
  });

  it('throws NotFoundError when tx belongs to another user', async () => {
    vi.mocked(AttachmentsRepository.findTransaction).mockResolvedValue({ ...mockTx, userId: 'other' } as never);
    await expect(
      AttachmentsService.create('tx1', 'u1', { filename: 'r.pdf', url: 'x', mimeType: 'application/pdf', sizeBytes: 100 }),
    ).rejects.toThrow(NotFoundError);
  });

  it('throws FileTooLargeError when file exceeds 10MB', async () => {
    vi.mocked(AttachmentsRepository.findTransaction).mockResolvedValue(mockTx as never);
    await expect(
      AttachmentsService.create('tx1', 'u1', { filename: 'big.pdf', url: 'x', mimeType: 'application/pdf', sizeBytes: 11 * 1024 * 1024 }),
    ).rejects.toThrow(FileTooLargeError);
  });

  it('throws UnsupportedFileTypeError for disallowed mime types', async () => {
    vi.mocked(AttachmentsRepository.findTransaction).mockResolvedValue(mockTx as never);
    await expect(
      AttachmentsService.create('tx1', 'u1', { filename: 'script.exe', url: 'x', mimeType: 'application/x-msdownload', sizeBytes: 1000 }),
    ).rejects.toThrow(UnsupportedFileTypeError);
  });

  it('throws AttachmentLimitError when transaction already has 5 attachments', async () => {
    vi.mocked(AttachmentsRepository.findTransaction).mockResolvedValue(mockTx as never);
    vi.mocked(AttachmentsRepository.countByTxId).mockResolvedValue(5);
    await expect(
      AttachmentsService.create('tx1', 'u1', { filename: 'r.pdf', url: 'x', mimeType: 'application/pdf', sizeBytes: 100 }),
    ).rejects.toThrow(AttachmentLimitError);
  });
});

describe('AttachmentsService.list', () => {
  it('returns active attachments for owned tx', async () => {
    vi.mocked(AttachmentsRepository.findTransaction).mockResolvedValue(mockTx as never);
    vi.mocked(AttachmentsRepository.findByTxId).mockResolvedValue([mockAttachment] as never);
    const result = await AttachmentsService.list('tx1', 'u1');
    expect(result).toHaveLength(1);
  });
});

describe('AttachmentsService.remove', () => {
  it('soft-deletes an attachment', async () => {
    vi.mocked(AttachmentsRepository.findTransaction).mockResolvedValue(mockTx as never);
    vi.mocked(AttachmentsRepository.softDelete).mockResolvedValue({ ...mockAttachment, deletedAt: new Date() } as never);
    const result = await AttachmentsService.remove('tx1', 'u1', 'att1');
    expect(result.deletedAt).toBeTruthy();
  });
});
