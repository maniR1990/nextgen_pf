import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountsService } from './accounts.service';
import { AccountsRepository } from './accounts.repository';
import {
  AccountArchiveBlockedError,
  AccountNotFoundError,
  ConflictError,
} from '@/lib/api/errors';

vi.mock('./accounts.repository');

const userId = 'u1';
const groupId = 'g1';

const mockAccount = {
  id: 'a1',
  userId,
  groupId,
  name: 'HDFC Savings',
  code: 'HDFC-SAV-01',
  type: 'BANK_SAVINGS' as const,
  subtype: null,
  balance: 50000,
  openingBalance: 50000,
  currency: 'INR',
  status: 'ACTIVE' as const,
  isPrimary: true,
  isExcludeNetWorth: false,
  isHidden: false,
  institutionId: null,
  archivedAt: null,
  balanceAsOf: new Date(),
  accountNumber: null,
  ifscCode: null,
  upiId: null,
  creditLimit: null,
  billingCycle: null,
  interestRate: null,
  minimumPayment: null,
  investedAmount: null,
  currentValue: null,
  absoluteReturn: null,
  xirr: null,
  maturityDate: null,
  lockInMonths: null,
  expectedReturn: null,
  category80C: false,
  principalAmount: null,
  emi: null,
  remainingEmis: null,
  interestPaidTotal: null,
  fundAllocations: [],
  linkedAccountIds: [],
  color: null,
  icon: null,
  note: null,
  tags: [],
  openedOn: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('AccountsService.list', () => {
  it('returns grouped accounts with net worth in meta', async () => {
    vi.mocked(AccountsRepository.findGroupsByUserId).mockResolvedValue([
      {
        id: groupId,
        userId,
        name: 'Banking',
        type: 'ASSET',
        slug: 'banking',
        order: 0,
        icon: null,
        color: null,
        isDefault: true,
        isCollapsed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never);
    vi.mocked(AccountsRepository.findMany).mockResolvedValue([
      { ...mockAccount, group: { id: groupId, name: 'Banking', type: 'ASSET', slug: 'banking' } },
    ] as never);
    vi.mocked(AccountsRepository.countMany).mockResolvedValue(1);
    vi.mocked(AccountsRepository.findAllForNetWorth).mockResolvedValue([
      { balance: 50000, isExcludeNetWorth: false, group: { type: 'ASSET' }, currency: 'INR' },
    ] as never);

    const { data, meta } = await AccountsService.list(userId, { page: 1, limit: 20 });
    expect(data).toHaveLength(1);
    expect(data[0].accounts).toHaveLength(1);
    expect(meta.netWorth).toEqual({ totalAssets: 50000, totalLiabilities: 0, netWorth: 50000, currency: 'INR' });
  });
});

describe('AccountsService.getById', () => {
  it('throws AccountNotFoundError for wrong owner', async () => {
    vi.mocked(AccountsRepository.findById).mockResolvedValue({ ...mockAccount, userId: 'other' } as never);
    await expect(AccountsService.getById('a1', userId)).rejects.toThrow(AccountNotFoundError);
  });
});

describe('AccountsService.archive', () => {
  it('blocks archive when EMIs remain', async () => {
    vi.mocked(AccountsRepository.findById).mockResolvedValue({
      ...mockAccount,
      remainingEmis: 12,
    } as never);
    await expect(AccountsService.archive('a1', userId)).rejects.toThrow(AccountArchiveBlockedError);
  });

  it('blocks archive when fund allocations are active', async () => {
    vi.mocked(AccountsRepository.findById).mockResolvedValue({
      ...mockAccount,
      fundAllocations: [{ fundId: 'f1', accountId: 'a1', type: 'PERCENTAGE', value: 0.2, priority: 0 }],
    } as never);
    await expect(AccountsService.archive('a1', userId)).rejects.toThrow(AccountArchiveBlockedError);
  });
});

describe('AccountsService.transfer', () => {
  it('rejects transfer to same account', async () => {
    await expect(
      AccountsService.transfer('a1', userId, { toAccountId: 'a1', amount: 100 }),
    ).rejects.toThrow(ConflictError);
  });
});

describe('AccountsService.patchBalance', () => {
  it('skips transaction when balance unchanged', async () => {
    vi.mocked(AccountsRepository.findById).mockResolvedValue(mockAccount as never);
    vi.mocked(AccountsRepository.findSummariesByIds).mockResolvedValue([]);
    vi.mocked(AccountsRepository.findRecentTransactions).mockResolvedValue([]);

    const result = await AccountsService.patchBalance('a1', userId, 50000);
    expect(result.balance).toBe(50000);
    expect(AccountsRepository.runTransaction).not.toHaveBeenCalled();
  });
});
