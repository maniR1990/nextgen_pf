import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountGroupsService } from './account-groups.service';
import { AccountGroupsRepository } from './account-groups.repository';
import {
  AccountGroupHasAccountsError,
  AccountGroupNotFoundError,
  ConflictError,
} from '@/lib/api/errors';

vi.mock('./account-groups.repository');

const userId = 'u1';

const mockGroup = {
  id: 'g1',
  userId,
  name: 'Banking',
  type: 'ASSET' as const,
  slug: 'banking',
  order: 0,
  icon: null,
  color: null,
  isDefault: false,
  isCollapsed: false,
  archivedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('AccountGroupsService.list', () => {
  it('returns groups with account stats and pagination meta', async () => {
    vi.mocked(AccountGroupsRepository.findMany).mockResolvedValue([mockGroup]);
    vi.mocked(AccountGroupsRepository.countMany).mockResolvedValue(1);
    vi.mocked(AccountGroupsRepository.aggregateBalancesByGroup).mockResolvedValue([
      { groupId: 'g1', _count: { id: 2 }, _sum: { balance: 75000 } },
    ] as never);

    const { data, meta } = await AccountGroupsService.list(userId, { page: 1, limit: 20 });
    expect(data[0].accountCount).toBe(2);
    expect(data[0].totalBalance).toBe(75000);
    expect(meta.total).toBe(1);
  });
});

describe('AccountGroupsService.create', () => {
  it('creates group with generated slug', async () => {
    vi.mocked(AccountGroupsRepository.findByUserAndSlug).mockResolvedValue(null);
    vi.mocked(AccountGroupsRepository.maxOrder).mockResolvedValue({ _max: { order: 2 } });
    vi.mocked(AccountGroupsRepository.create).mockResolvedValue({
      ...mockGroup,
      name: 'Custom Goals',
      slug: 'custom-goals',
    });

    const result = await AccountGroupsService.create(userId, {
      name: 'Custom Goals',
      type: 'asset',
    });
    expect(result.slug).toBe('custom-goals');
    expect(AccountGroupsRepository.create).toHaveBeenCalled();
  });
});

describe('AccountGroupsService.delete', () => {
  it('rejects when accounts are assigned', async () => {
    vi.mocked(AccountGroupsRepository.findById).mockResolvedValue(mockGroup);
    vi.mocked(AccountGroupsRepository.countAccountsInGroup).mockResolvedValue(3);

    await expect(AccountGroupsService.delete('g1', userId)).rejects.toThrow(
      AccountGroupHasAccountsError,
    );
  });

  it('rejects default groups', async () => {
    vi.mocked(AccountGroupsRepository.findById).mockResolvedValue({
      ...mockGroup,
      isDefault: true,
    });
    await expect(AccountGroupsService.delete('g1', userId)).rejects.toThrow(ConflictError);
  });
});

describe('AccountGroupsService.reorder', () => {
  it('throws when group belongs to another user', async () => {
    vi.mocked(AccountGroupsRepository.findById).mockResolvedValue({
      ...mockGroup,
      userId: 'other',
    });
    await expect(
      AccountGroupsService.reorder(userId, [{ id: 'g1', order: 1 }]),
    ).rejects.toThrow(AccountGroupNotFoundError);
  });
});
