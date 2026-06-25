import { prisma } from '@/lib/db/prisma';

export const AttachmentsRepository = {
  findTransaction: (txId: string) =>
    prisma.financeTransaction.findUniqueOrThrow({
      where: { id: txId },
      select: { id: true, userId: true, status: true },
    }),

  countByTxId: (txId: string) =>
    prisma.attachment.count({ where: { txId, deletedAt: null } }),

  findByTxId: (txId: string) =>
    prisma.attachment.findMany({
      where: { txId, deletedAt: null },
      orderBy: { uploadedAt: 'asc' },
    }),

  create: (data: {
    txId: string;
    filename: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
  }) =>
    prisma.attachment.create({ data }),

  findByIdAndTxId: (id: string, txId: string) =>
    prisma.attachment.findFirstOrThrow({ where: { id, txId, deletedAt: null } }),

  softDelete: (id: string) =>
    prisma.attachment.update({ where: { id }, data: { deletedAt: new Date() } }),
};
