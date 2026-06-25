import { toAccountGroupType } from '@/constants/account-groups';
import {
  AccountGroupHasAccountsError,
  AccountGroupNotFoundError,
  ConflictError,
} from '@/lib/api/errors';
import { buildMeta } from '@/lib/api/pagination';
import { AccountGroupsRepository } from './account-groups.repository';
import type {
  AccountGroupSummary,
  CreateAccountGroupDto,
  ListAccountGroupsQuery,
  ReorderAccountGroupItem,
  UpdateAccountGroupDto,
} from './account-groups.types';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'group'
  );
}

async function uniqueSlug(userId: string, base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await AccountGroupsRepository.findByUserAndSlug(userId, slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function assertOwned(group: { userId: string }, userId: string) {
  if (group.userId !== userId) throw new AccountGroupNotFoundError();
}

function toSummary(
  group: Awaited<ReturnType<typeof AccountGroupsRepository.findById>>,
  stats: { accountCount: number; totalBalance: number },
): AccountGroupSummary {
  return {
    id: group.id,
    name: group.name,
    type: group.type,
    slug: group.slug,
    order: group.order,
    icon: group.icon,
    color: group.color,
    isDefault: group.isDefault,
    isCollapsed: group.isCollapsed,
    accountCount: stats.accountCount,
    totalBalance: stats.totalBalance,
    archivedAt: group.archivedAt,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

async function attachStats(
  userId: string,
  groups: Awaited<ReturnType<typeof AccountGroupsRepository.findMany>>,
): Promise<AccountGroupSummary[]> {
  const groupIds = groups.map((g) => g.id);
  const aggregates = await AccountGroupsRepository.aggregateBalancesByGroup(userId, groupIds);
  const statsMap = new Map(
    aggregates.map((row) => [
      row.groupId,
      { accountCount: row._count.id, totalBalance: row._sum.balance ?? 0 },
    ]),
  );

  return groups.map((group) =>
    toSummary(group, statsMap.get(group.id) ?? { accountCount: 0, totalBalance: 0 }),
  );
}

export const AccountGroupsService = {
  async list(userId: string, query: ListAccountGroupsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const prismaType = query.type ? toAccountGroupType(query.type) : undefined;

    const [groups, total] = await Promise.all([
      AccountGroupsRepository.findMany(userId, {
        skip,
        take: limit,
        sort: query.sort ?? 'order_asc',
        includeArchived: query.includeArchived,
        type: prismaType,
      }),
      AccountGroupsRepository.countMany(userId, {
        includeArchived: query.includeArchived,
        type: prismaType,
      }),
    ]);

    let summaries = await attachStats(userId, groups);

    if (query.sort === 'balance_desc') {
      summaries = [...summaries].sort((a, b) => b.totalBalance - a.totalBalance);
    }

    return {
      data: summaries,
      meta: buildMeta(page, limit, total),
    };
  },

  async create(userId: string, dto: CreateAccountGroupDto) {
    const baseSlug = slugify(dto.name);
    const slug = await uniqueSlug(userId, baseSlug);
    const maxOrder = await AccountGroupsRepository.maxOrder(userId);
    const order = dto.order ?? (maxOrder._max?.order ?? -1) + 1;

    const created = await AccountGroupsRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      type: toAccountGroupType(dto.type),
      slug,
      order,
      icon: dto.icon,
      color: dto.color,
    });

    return toSummary(created, { accountCount: 0, totalBalance: 0 });
  },

  async update(id: string, userId: string, dto: UpdateAccountGroupDto) {
    const existing = await AccountGroupsRepository.findById(id);
    assertOwned(existing, userId);

    if (existing.archivedAt) {
      throw new ConflictError('Cannot update archived account group');
    }

    const updated = await AccountGroupsRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.order !== undefined && { order: dto.order }),
    });

    const accountCount = await AccountGroupsRepository.countAccountsInGroup(id);
    const aggregates = await AccountGroupsRepository.aggregateBalancesByGroup(userId, [id]);
    const totalBalance = aggregates[0]?._sum.balance ?? 0;

    return toSummary(updated, { accountCount, totalBalance });
  },

  async reorder(userId: string, items: ReorderAccountGroupItem[]) {
    const ids = items.map((item) => item.id);
    const groups = await Promise.all(ids.map((id) => AccountGroupsRepository.findById(id)));

    for (const group of groups) {
      assertOwned(group, userId);
      if (group.archivedAt) {
        throw new ConflictError('Cannot reorder archived account groups');
      }
    }

    const updated = await AccountGroupsRepository.reorder(items);
    return attachStats(userId, updated);
  },

  async delete(id: string, userId: string) {
    const group = await AccountGroupsRepository.findById(id);
    assertOwned(group, userId);

    if (group.isDefault) {
      throw new ConflictError('Cannot delete default account group');
    }

    const accountCount = await AccountGroupsRepository.countAccountsInGroup(id, true);
    if (accountCount > 0) {
      throw new AccountGroupHasAccountsError(accountCount);
    }

    await AccountGroupsRepository.delete(id);
    return { deleted: true, id };
  },
};
