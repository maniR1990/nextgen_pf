import { NotFoundError } from '@/lib/api/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SinkingFundsRepository } from './sinking-funds.repository';
import { SinkingFundsService } from './sinking-funds.service';

vi.mock('./sinking-funds.repository');

const mockFund = {
  id: 'sf1',
  userId: 'u1',
  name: 'Emergency Fund',
  purpose: 'EMERGENCY',
  targetAmount: 100000,
  targetMonths: 6,
  color: null,
  icon: null,
  order: 0,
  milestones: [],
  archivedAt: null,
};

beforeEach(() => vi.clearAllMocks());

describe('SinkingFundsService.list', () => {
  it('returns all active funds for the user', async () => {
    vi.mocked(SinkingFundsRepository.findByUserId).mockResolvedValue([mockFund] as never);
    const result = await SinkingFundsService.list('u1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('sf1');
    expect(result[0].name).toBe('Emergency Fund');
  });

  it('returns empty array when user has no funds', async () => {
    vi.mocked(SinkingFundsRepository.findByUserId).mockResolvedValue([]);
    const result = await SinkingFundsService.list('u1');
    expect(result).toHaveLength(0);
  });
});

describe('SinkingFundsService.deposit', () => {
  it('accepts deposit and returns fund DTO (balance is computed from allocations)', async () => {
    vi.mocked(SinkingFundsRepository.findById).mockResolvedValue(mockFund as never);
    const result = await SinkingFundsService.deposit('sf1', 'u1', 5000);
    expect(result.id).toBe('sf1');
    // currentBalance is computed from FundAllocations, not stored — always 0 until allocation tracking
    expect(result.currentBalance).toBe(0);
  });

  it('throws NotFoundError when fund belongs to another user', async () => {
    vi.mocked(SinkingFundsRepository.findById).mockResolvedValue({
      ...mockFund,
      userId: 'other',
    } as never);
    await expect(SinkingFundsService.deposit('sf1', 'u1', 5000)).rejects.toThrow(NotFoundError);
  });
});
