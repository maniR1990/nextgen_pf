import { NotFoundError } from '@/lib/api/errors';
import { getLogger } from '@/lib/logger';
import { prisma } from '@/lib/db/prisma';
import { PaymentSourcesRepository } from './payment-sources.repository';

const log = getLogger('PaymentSourcesService');

function assertOwned(source: { userId: string }, userId: string) {
  if (source.userId !== userId) throw new NotFoundError('Payment source not found');
}

function toDto(row: Awaited<ReturnType<typeof PaymentSourcesRepository.findByUserId>>[number]) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    bank: row.institution?.shortName ?? null,
    accountNumberLast4: row.accountNumber ?? null,
    currentBalance: row.balance,
    creditLimit: row.creditLimit ?? null,
    isActive: row.status === 'ACTIVE',
    createdAt: row.createdAt,
  };
}

export const PaymentSourcesService = {
  async create(userId: string, data: {
    name: string;
    type: string;
    bank?: string;
    accountNumberLast4?: string;
    currentBalance?: number;
    creditLimit?: number;
  }) {
    const group = await prisma.accountGroup.findFirst({ where: { userId } });
    if (!group) throw new NotFoundError('No account group found');
    const code = `${data.type.slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;
    const row = await PaymentSourcesRepository.create({
      user: { connect: { id: userId } },
      group: { connect: { id: group.id } },
      code,
      name: data.name,
      type: data.type as never,
      balance: data.currentBalance ?? 0,
      accountNumber: data.accountNumberLast4,
      creditLimit: data.creditLimit,
    });
    return toDto(row);
  },

  async list(userId: string) {
    const rows = await PaymentSourcesRepository.findByUserId(userId);
    return rows.map(toDto);
  },

  async updateBalance(id: string, userId: string, balance: number) {
    const source = await PaymentSourcesRepository.findById(id);
    assertOwned(source, userId);
    log.info('updateBalance', { id, balance });
    const row = await PaymentSourcesRepository.updateBalance(id, balance);
    return toDto(row);
  },

  async getStatement(
    id: string,
    userId: string,
    options: { limit: number; cursor?: string },
  ) {
    const source = await PaymentSourcesRepository.findById(id);
    assertOwned(source, userId);

    const { limit, cursor } = options;
    const rows = await PaymentSourcesRepository.findTransactions(id, { take: limit + 1, cursor });
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();
    const nextCursor = hasMore ? rows[rows.length - 1].id : null;
    return { rows, hasMore, nextCursor, limit };
  },
};
