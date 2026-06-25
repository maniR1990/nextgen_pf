import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FundGroupsService } from './fund-groups.service';
import { FundGroupsRepository } from './fund-groups.repository';
import { ConflictError, NotFoundError } from '@/lib/api/errors';

vi.mock('./fund-groups.repository');

const mockGroup = {
  id: 'fg1',
  userId: 'u1',
  name: 'Emergency',
  description: 'Safety net — 3-6 months expenses',
  slug: 'emergency',
  purposeHint: 'EMERGENCY',
  order: 0,
  color: '#ef4444',
  isSystem: true,
  archivedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

beforeEach(() => vi.clearAllMocks());

describe('FundGroupsService.list', () => {
  it('returns all groups for user', async () => {
    vi.mocked(FundGroupsRepository.findByUserId).mockResolvedValue([mockGroup] as never);
    const result = await FundGroupsService.list('u1');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('fg1');
    expect(result[0].name).toBe('Emergency');
    expect(result[0].isSystem).toBe(true);
  });

  it('returns empty array when user has no groups', async () => {
    vi.mocked(FundGroupsRepository.findByUserId).mockResolvedValue([]);
    const result = await FundGroupsService.list('u1');
    expect(result).toHaveLength(0);
  });
});

describe('FundGroupsService.create', () => {
  it('creates a custom group and auto-slugifies name', async () => {
    const created = {
      ...mockGroup,
      id: 'fg2',
      name: 'Kids Education',
      slug: 'kids-education',
      isSystem: false,
      purposeHint: null,
    };
    vi.mocked(FundGroupsRepository.maxOrder).mockResolvedValue({ _max: { order: null } } as never);
    vi.mocked(FundGroupsRepository.create).mockResolvedValue(created as never);
    const result = await FundGroupsService.create('u1', { name: 'Kids Education' });
    expect(FundGroupsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'kids-education', isSystem: false }),
    );
    expect(result.name).toBe('Kids Education');
    expect(result.isSystem).toBe(false);
  });

  it('strips special characters when generating slug', async () => {
    const created = {
      ...mockGroup,
      id: 'fg3',
      name: 'My Fund!',
      slug: 'my-fund',
      isSystem: false,
      purposeHint: null,
    };
    vi.mocked(FundGroupsRepository.maxOrder).mockResolvedValue({ _max: { order: null } } as never);
    vi.mocked(FundGroupsRepository.create).mockResolvedValue(created as never);
    await FundGroupsService.create('u1', { name: 'My Fund!' });
    expect(FundGroupsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'my-fund' }),
    );
  });
});

describe('FundGroupsService.update', () => {
  it('renames a group successfully', async () => {
    const updated = { ...mockGroup, name: 'Emergency Buffer' };
    vi.mocked(FundGroupsRepository.findById).mockResolvedValue(mockGroup as never);
    vi.mocked(FundGroupsRepository.update).mockResolvedValue(updated as never);
    const result = await FundGroupsService.update('fg1', 'u1', { name: 'Emergency Buffer' });
    expect(result.name).toBe('Emergency Buffer');
  });

  it('throws NotFoundError when group belongs to another user', async () => {
    vi.mocked(FundGroupsRepository.findById).mockResolvedValue({
      ...mockGroup,
      userId: 'other-user',
    } as never);
    await expect(FundGroupsService.update('fg1', 'u1', { name: 'X' })).rejects.toThrow(NotFoundError);
  });
});

describe('FundGroupsService.delete', () => {
  it('deletes an empty custom group', async () => {
    const customGroup = { ...mockGroup, isSystem: false };
    vi.mocked(FundGroupsRepository.findById).mockResolvedValue(customGroup as never);
    vi.mocked(FundGroupsRepository.countFunds).mockResolvedValue(0);
    vi.mocked(FundGroupsRepository.softDelete).mockResolvedValue(undefined as never);
    await expect(FundGroupsService.delete('fg1', 'u1')).resolves.toBeUndefined();
    expect(FundGroupsRepository.softDelete).toHaveBeenCalledWith('fg1');
  });

  it('throws ConflictError when group has active funds', async () => {
    const customGroup = { ...mockGroup, isSystem: false };
    vi.mocked(FundGroupsRepository.findById).mockResolvedValue(customGroup as never);
    vi.mocked(FundGroupsRepository.countFunds).mockResolvedValue(3);
    await expect(FundGroupsService.delete('fg1', 'u1')).rejects.toThrow(ConflictError);
    expect(FundGroupsRepository.softDelete).not.toHaveBeenCalled();
  });

  it('throws ConflictError when trying to delete a system group', async () => {
    vi.mocked(FundGroupsRepository.findById).mockResolvedValue(mockGroup as never);
    await expect(FundGroupsService.delete('fg1', 'u1')).rejects.toThrow(ConflictError);
    expect(FundGroupsRepository.countFunds).not.toHaveBeenCalled();
    expect(FundGroupsRepository.softDelete).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when group belongs to another user', async () => {
    vi.mocked(FundGroupsRepository.findById).mockResolvedValue({
      ...mockGroup,
      userId: 'other-user',
    } as never);
    await expect(FundGroupsService.delete('fg1', 'u1')).rejects.toThrow(NotFoundError);
    expect(FundGroupsRepository.countFunds).not.toHaveBeenCalled();
    expect(FundGroupsRepository.softDelete).not.toHaveBeenCalled();
  });
});
