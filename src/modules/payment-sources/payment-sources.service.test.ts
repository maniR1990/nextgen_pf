import { NotFoundError } from '@/lib/api/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentSourcesRepository } from './payment-sources.repository';
import { PaymentSourcesService } from './payment-sources.service';

vi.mock('./payment-sources.repository');

const mockSource = {
  id: 'ps1',
  userId: 'u1',
  name: 'HDFC Savings',
  type: 'BANK_SAVINGS',
  balance: 50000,
  balanceAsOf: null,
  status: 'ACTIVE',
  institution: null,
  accountNumber: null,
  creditLimit: null,
  createdAt: new Date(),
};

const mockTx = {
  id: 'tx1',
  date: new Date(),
  merchant: 'Amazon',
  amount: 500,
  type: 'EXPENSE',
  status: 'CLEARED',
  category: null,
};

beforeEach(() => vi.clearAllMocks());

describe('PaymentSourcesService.list', () => {
  it('returns all active sources for the user', async () => {
    vi.mocked(PaymentSourcesRepository.findByUserId).mockResolvedValue([mockSource] as never);
    const result = await PaymentSourcesService.list('u1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ps1');
    expect(result[0].isActive).toBe(true);
  });
});

describe('PaymentSourcesService.updateBalance', () => {
  it('updates balance for owned source', async () => {
    vi.mocked(PaymentSourcesRepository.findById).mockResolvedValue(mockSource as never);
    vi.mocked(PaymentSourcesRepository.updateBalance).mockResolvedValue({
      ...mockSource,
      balance: 60000,
    } as never);
    const result = await PaymentSourcesService.updateBalance('ps1', 'u1', 60000);
    expect(result.currentBalance).toBe(60000);
  });

  it('throws NotFoundError when source belongs to another user', async () => {
    vi.mocked(PaymentSourcesRepository.findById).mockResolvedValue({
      ...mockSource,
      userId: 'other',
    } as never);
    await expect(PaymentSourcesService.updateBalance('ps1', 'u1', 60000)).rejects.toThrow(
      NotFoundError,
    );
  });
});

describe('PaymentSourcesService.getStatement', () => {
  it('returns paginated transactions with hasMore when extra row present', async () => {
    vi.mocked(PaymentSourcesRepository.findById).mockResolvedValue(mockSource as never);
    vi.mocked(PaymentSourcesRepository.findTransactions).mockResolvedValue([
      mockTx,
      mockTx,
    ] as never);
    const result = await PaymentSourcesService.getStatement('ps1', 'u1', { limit: 1 });
    expect(result.rows).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('tx1');
  });

  it('returns all rows without hasMore when at end', async () => {
    vi.mocked(PaymentSourcesRepository.findById).mockResolvedValue(mockSource as never);
    vi.mocked(PaymentSourcesRepository.findTransactions).mockResolvedValue([mockTx] as never);
    const result = await PaymentSourcesService.getStatement('ps1', 'u1', { limit: 20 });
    expect(result.rows).toHaveLength(1);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('throws NotFoundError when source belongs to another user', async () => {
    vi.mocked(PaymentSourcesRepository.findById).mockResolvedValue({
      ...mockSource,
      userId: 'other',
    } as never);
    await expect(PaymentSourcesService.getStatement('ps1', 'u1', { limit: 20 })).rejects.toThrow(
      NotFoundError,
    );
  });
});
