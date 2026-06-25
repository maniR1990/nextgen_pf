import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FundsService } from './funds.service';
import { FundsRepository } from './funds.repository';
import { FundGroupsRepository } from '@/modules/fund-groups/fund-groups.repository';
import { FundAllocationNotFoundError, FundNotFoundError } from '@/lib/api/errors';

vi.mock('./funds.repository');
vi.mock('@/modules/fund-groups/fund-groups.repository');

const userId = 'u1';

// group relation removed from FUND_SELECT — enrichFund/enrichMany do separate lookup via findByIds
const mockFund = {
  id: 'f1',
  userId,
  name: 'Emergency Fund',
  purpose: 'EMERGENCY' as const,
  groupId: 'fg1',
  targetAmount: 100000,
  targetMonths: 6,
  sources: [
    { fundId: 'f1', accountId: 'a1', type: 'PERCENTAGE' as const, value: 0.3, priority: 0 },
  ],
  goalId: null,
  color: null,
  icon: null,
  order: 0,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGroup = {
  id: 'fg1',
  userId,
  name: 'Emergency',
  description: null,
  slug: 'emergency',
  purposeHint: 'EMERGENCY' as const,
  order: 0,
  color: '#ef4444',
  isSystem: true,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(FundGroupsRepository.findByIds).mockResolvedValue([mockGroup] as never);
});

describe('FundsService.list', () => {
  it('returns funds with computed currentAmount and fill percent', async () => {
    vi.mocked(FundsRepository.findMany).mockResolvedValue([mockFund]);
    vi.mocked(FundsRepository.countMany).mockResolvedValue(1);
    vi.mocked(FundsRepository.findAccountsByIds).mockResolvedValue([
      { id: 'a1', name: 'HDFC Savings', code: 'HDFC-SAV-01', balance: 100000 },
    ]);

    const { data, meta } = await FundsService.list(userId, { page: 1, limit: 20 });
    expect(data[0].currentAmount).toBe(30000);
    expect(data[0].percentFilled).toBe(30);
    expect(data[0].sources[0].accountName).toBe('HDFC Savings');
    expect(meta.total).toBe(1);
  });

  it('does not include categoryId in returned fund summaries', async () => {
    vi.mocked(FundsRepository.findMany).mockResolvedValue([mockFund]);
    vi.mocked(FundsRepository.countMany).mockResolvedValue(1);
    vi.mocked(FundsRepository.findAccountsByIds).mockResolvedValue([
      { id: 'a1', name: 'HDFC Savings', code: 'HDFC-SAV-01', balance: 100000 },
    ]);

    const { data } = await FundsService.list(userId, { page: 1, limit: 20 });
    expect('categoryId' in data[0]).toBe(false);
  });
});

describe('FundsService.create', () => {
  it('creates a fund without requiring categoryId', async () => {
    vi.mocked(FundsRepository.findAccountsByIds).mockResolvedValue([]);
    vi.mocked(FundsRepository.maxOrder).mockResolvedValue({ _max: { order: 0 } });
    vi.mocked(FundsRepository.create).mockResolvedValue({ ...mockFund, name: 'Tax Fund', purpose: 'TAX' });

    const result = await FundsService.create(userId, {
      name: 'Tax Fund',
      purpose: 'TAX',
      targetAmount: 150000,
    });

    expect(result.name).toBe('Tax Fund');
    expect(FundsRepository.create).toHaveBeenCalledOnce();
    // Confirm no category lookup was made
    expect(vi.mocked(FundsRepository).findDefaultCategory).toBeUndefined();
    expect(vi.mocked(FundsRepository).findCategoryForUser).toBeUndefined();
  });

  it('sets order to maxOrder + 1', async () => {
    vi.mocked(FundsRepository.findAccountsByIds).mockResolvedValue([]);
    vi.mocked(FundsRepository.maxOrder).mockResolvedValue({ _max: { order: 4 } });
    vi.mocked(FundsRepository.create).mockResolvedValue({ ...mockFund, order: 5 });

    await FundsService.create(userId, {
      name: 'New Fund',
      purpose: 'GOAL',
      targetAmount: 500000,
    });

    const callArg = vi.mocked(FundsRepository.create).mock.calls[0][0] as { order: number };
    expect(callArg.order).toBe(5);
  });

  it('throws when source account does not belong to user', async () => {
    vi.mocked(FundsRepository.findAccountsByIds).mockResolvedValue([]); // empty = not found
    vi.mocked(FundsRepository.maxOrder).mockResolvedValue({ _max: { order: 0 } });

    await expect(
      FundsService.create(userId, {
        name: 'Wealth Corpus',
        purpose: 'WEALTH',
        targetAmount: 1000000,
        sources: [{ accountId: 'bad-id', type: 'FIXED', value: 1000 }],
      }),
    ).rejects.toThrow('One or more source accounts not found');
  });
});

describe('FundsService.setupDefaults', () => {
  it('creates 8 system groups and 8 default funds when user has none', async () => {
    vi.mocked(FundsRepository.countMany).mockResolvedValue(0);
    vi.mocked(FundsRepository.maxOrder).mockResolvedValue({ _max: { order: null } });
    vi.mocked(FundsRepository.create).mockImplementation(async (data) => ({
      ...mockFund,
      name: (data as { name: string }).name,
      purpose: (data as { purpose: string }).purpose as typeof mockFund.purpose,
    }));
    vi.mocked(FundGroupsRepository.maxOrder).mockResolvedValue({ _max: { order: null } });
    vi.mocked(FundGroupsRepository.create).mockResolvedValue(mockGroup);

    const result = await FundsService.setupDefaults(userId);
    expect(result.created).toBe(8);
    expect(FundsRepository.create).toHaveBeenCalledTimes(8);
    expect(FundGroupsRepository.create).toHaveBeenCalledTimes(8);
  });

  it('is idempotent — skips creation when user already has funds', async () => {
    vi.mocked(FundsRepository.countMany).mockResolvedValue(3);

    const result = await FundsService.setupDefaults(userId);
    expect(result.created).toBe(0);
    expect(FundsRepository.create).not.toHaveBeenCalled();
    expect(FundGroupsRepository.create).not.toHaveBeenCalled();
  });

  it('creates funds with all 8 distinct purposes', async () => {
    vi.mocked(FundsRepository.countMany).mockResolvedValue(0);
    vi.mocked(FundsRepository.maxOrder).mockResolvedValue({ _max: { order: null } });
    vi.mocked(FundsRepository.create).mockResolvedValue(mockFund);
    vi.mocked(FundGroupsRepository.maxOrder).mockResolvedValue({ _max: { order: null } });
    vi.mocked(FundGroupsRepository.create).mockResolvedValue(mockGroup);

    await FundsService.setupDefaults(userId);

    const createdPurposes = vi.mocked(FundsRepository.create).mock.calls.map(
      ([data]) => (data as { purpose: string }).purpose,
    );
    const expected = ['EMERGENCY', 'OPS', 'GOAL', 'TAX', 'INSURANCE', 'SINKING', 'INVESTMENT', 'WEALTH'];
    expect(createdPurposes).toEqual(expect.arrayContaining(expected));
    expect(new Set(createdPurposes).size).toBe(8);
  });
});

describe('FundsService.allocate', () => {
  it('upserts allocation for account', async () => {
    vi.mocked(FundsRepository.findById).mockResolvedValue(mockFund);
    vi.mocked(FundsRepository.findAccountsByIds).mockResolvedValue([
      { id: 'a2', name: 'Wallet', code: 'WAL-01', balance: 5000 },
    ]);
    vi.mocked(FundsRepository.update).mockResolvedValue({
      ...mockFund,
      sources: [
        ...mockFund.sources,
        { fundId: 'f1', accountId: 'a2', type: 'FIXED', value: 5000, priority: 1 },
      ],
    });

    const result = await FundsService.allocate('f1', userId, {
      accountId: 'a2',
      type: 'FIXED',
      value: 5000,
    });
    expect(result.sources).toHaveLength(2);
  });
});

describe('FundsService.removeAllocation', () => {
  it('throws when allocation missing', async () => {
    vi.mocked(FundsRepository.findById).mockResolvedValue(mockFund);
    await expect(FundsService.removeAllocation('f1', userId, 'missing')).rejects.toThrow(
      FundAllocationNotFoundError,
    );
  });
});

describe('FundsService.getSummary', () => {
  it('returns aggregate allocation and health radar', async () => {
    vi.mocked(FundsRepository.findAllActive).mockResolvedValue([mockFund]);
    vi.mocked(FundsRepository.findUserAccounts).mockResolvedValue([
      { id: 'a1', name: 'HDFC Savings', code: 'HDFC-SAV-01', balance: 100000 },
    ]);

    const summary = await FundsService.getSummary(userId);
    expect(summary.totalAllocated).toBe(30000);
    expect(summary.fundHealthRadar[0].health).toBe('low');
    expect(summary.currency).toBe('INR');
  });
});

describe('FundsService.update', () => {
  it('throws for wrong owner', async () => {
    vi.mocked(FundsRepository.findById).mockResolvedValue({ ...mockFund, userId: 'other' });
    await expect(FundsService.update('f1', userId, { name: 'X' })).rejects.toThrow(FundNotFoundError);
  });
});
