import {
  FundGroupHasFundsError,
  FundGroupNotFoundError,
  FundGroupSystemError,
} from '@/lib/api/errors';
import { FundGroupsRepository } from './fund-groups.repository';
import type { CreateFundGroupDto, UpdateFundGroupDto } from './fund-groups.types';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function assertOwned(group: { userId: string }, userId: string) {
  if (group.userId !== userId) throw new FundGroupNotFoundError();
}

export const FundGroupsService = {
  async list(userId: string, includeArchived = false) {
    return FundGroupsRepository.findByUserId(userId, includeArchived);
  },

  async restore(id: string, userId: string): Promise<void> {
    const group = await FundGroupsRepository.findById(id);
    assertOwned(group, userId);
    if (!group.archivedAt) return;
    await FundGroupsRepository.restore(id);
  },

  async create(userId: string, dto: CreateFundGroupDto) {
    const maxOrder = await FundGroupsRepository.maxOrder(userId);
    const order = dto.order ?? ((maxOrder._max?.order ?? -1) + 1);

    const baseSlug = toSlug(dto.name);
    let slug = baseSlug;
    let suffix = 2;
    while (await FundGroupsRepository.slugExists(userId, slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    return FundGroupsRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      description: dto.description,
      slug,
      color: dto.color,
      order,
      isSystem: false,
    });
  },

  async update(id: string, userId: string, dto: UpdateFundGroupDto) {
    const existing = await FundGroupsRepository.findById(id);
    assertOwned(existing, userId);

    return FundGroupsRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.order !== undefined && { order: dto.order }),
    });
  },

  async delete(id: string, userId: string): Promise<void> {
    const group = await FundGroupsRepository.findById(id);
    assertOwned(group, userId);

    if (group.isSystem) throw new FundGroupSystemError();

    const fundCount = await FundGroupsRepository.countFunds(id);
    if (fundCount > 0) throw new FundGroupHasFundsError(fundCount);

    await FundGroupsRepository.softDelete(id);
  },
};
