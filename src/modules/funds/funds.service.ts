import { FundAllocationNotFoundError, FundNotFoundError, NotFoundError } from '@/lib/api/errors';
import { buildMeta } from '@/lib/api/pagination';
import { FundGroupsRepository } from '@/modules/fund-groups/fund-groups.repository';
import { TransactionRepository } from '@/modules/transactions/transactions.repository';
import type { FundAllocation } from '@prisma/client';
import { FundsRepository } from './funds.repository';
import type {
  AllocateFundDto,
  CreateFundDto,
  FundSummary,
  FundsAggregateSummary,
  ListFundsQuery,
  UpdateFundDto,
} from './funds.types';
import {
  buildSourceBreakdown,
  computeFundCurrentAmount,
  computeIdleCash,
  computePercentFilled,
  resolveFundHealth,
} from './lib/fund-compute';

const DEFAULT_FUNDS: Array<{
  name: string;
  purpose: CreateFundDto['purpose'];
  groupSlug: string;
  targetAmount: number;
  color: string;
  order: number;
}> = [
  {
    name: 'Emergency Fund',
    purpose: 'EMERGENCY',
    groupSlug: 'emergency',
    targetAmount: 600000,
    color: '#ef4444',
    order: 0,
  },
  {
    name: 'Monthly Buffer',
    purpose: 'OPS',
    groupSlug: 'ops',
    targetAmount: 150000,
    color: '#f97316',
    order: 1,
  },
  {
    name: 'Home Down Payment',
    purpose: 'GOAL',
    groupSlug: 'goal',
    targetAmount: 5000000,
    color: '#3b82f6',
    order: 2,
  },
  {
    name: 'Tax Provision FY26',
    purpose: 'TAX',
    groupSlug: 'tax',
    targetAmount: 150000,
    color: '#8b5cf6',
    order: 3,
  },
  {
    name: 'Insurance Premiums',
    purpose: 'INSURANCE',
    groupSlug: 'insurance',
    targetAmount: 50000,
    color: '#06b6d4',
    order: 4,
  },
  {
    name: 'Car Upgrade',
    purpose: 'SINKING',
    groupSlug: 'sinking',
    targetAmount: 1000000,
    color: '#10b981',
    order: 5,
  },
  {
    name: 'Investment Pool',
    purpose: 'INVESTMENT',
    groupSlug: 'investment',
    targetAmount: 500000,
    color: '#6366f1',
    order: 6,
  },
  {
    name: 'Wealth Corpus',
    purpose: 'WEALTH',
    groupSlug: 'wealth',
    targetAmount: 10000000,
    color: '#f59e0b',
    order: 7,
  },
];

const DEFAULT_GROUPS: Array<{
  name: string;
  description: string;
  slug: string;
  purposeHint: CreateFundDto['purpose'];
  color: string;
  order: number;
}> = [
  {
    name: 'Emergency',
    description: 'Safety net — 3-6 months expenses',
    slug: 'emergency',
    purposeHint: 'EMERGENCY',
    color: '#ef4444',
    order: 0,
  },
  {
    name: 'Operations',
    description: 'Monthly cash flow buffer',
    slug: 'ops',
    purposeHint: 'OPS',
    color: '#f97316',
    order: 1,
  },
  {
    name: 'Goals',
    description: 'Targeted savings goals',
    slug: 'goal',
    purposeHint: 'GOAL',
    color: '#3b82f6',
    order: 2,
  },
  {
    name: 'Tax',
    description: 'Tax provisions & advance tax',
    slug: 'tax',
    purposeHint: 'TAX',
    color: '#8b5cf6',
    order: 3,
  },
  {
    name: 'Insurance',
    description: 'Premium reserves',
    slug: 'insurance',
    purposeHint: 'INSURANCE',
    color: '#06b6d4',
    order: 4,
  },
  {
    name: 'Sinking',
    description: 'Planned large expenses',
    slug: 'sinking',
    purposeHint: 'SINKING',
    color: '#10b981',
    order: 5,
  },
  {
    name: 'Investment Pool',
    description: 'Cash earmarked for deployment',
    slug: 'investment',
    purposeHint: 'INVESTMENT',
    color: '#6366f1',
    order: 6,
  },
  {
    name: 'Wealth',
    description: 'Long-term wealth accumulation',
    slug: 'wealth',
    purposeHint: 'WEALTH',
    color: '#f59e0b',
    order: 7,
  },
];

function assertOwned(fund: { userId: string }, userId: string) {
  if (fund.userId !== userId) throw new FundNotFoundError();
}

function normalizeSources(fundId: string, sources: AllocateFundDto[]): FundAllocation[] {
  return sources.map((src) => ({
    fundId,
    accountId: src.accountId,
    type: src.type,
    value: src.value,
    priority: src.priority ?? 0,
  }));
}

async function loadAccountMap(userId: string, accountIds: string[]) {
  const accounts = await FundsRepository.findAccountsByIds(userId, accountIds);
  return new Map(accounts.map((a) => [a.id, a]));
}

async function loadGroupMap(groupIds: string[]) {
  const unique = [...new Set(groupIds.filter(Boolean))];
  if (unique.length === 0)
    return new Map<string, { name: string; slug: string; description: string | null }>();
  const groups = await FundGroupsRepository.findByIds(unique);
  return new Map(
    groups.map((g) => [g.id, { name: g.name, slug: g.slug, description: g.description }]),
  );
}

async function enrichFund(
  userId: string,
  fund: Awaited<ReturnType<typeof FundsRepository.findById>>,
): Promise<FundSummary> {
  const accountIds = fund.sources.map((s) => s.accountId);
  const accountMap = await loadAccountMap(userId, accountIds);
  const balanceMap = new Map([...accountMap.entries()].map(([id, a]) => [id, a.balance]));
  // A Fund with no percentage/fixed claim configured is tracked purely by tagged
  // transfers instead — see TransactionRepository.sumTransfersByFund. Funds that DO
  // have sources[] configured keep using that math unchanged, to protect balances
  // already relied on today.
  const currentAmount =
    fund.sources.length > 0
      ? computeFundCurrentAmount(fund.sources, balanceMap)
      : (await TransactionRepository.sumTransfersByFund(userId, [fund.id])).get(fund.id) ?? 0;
  const sources = buildSourceBreakdown(fund.sources, accountMap);
  const groupMap = await loadGroupMap(fund.groupId ? [fund.groupId] : []);
  const grp = fund.groupId ? groupMap.get(fund.groupId) : undefined;

  return {
    id: fund.id,
    name: fund.name,
    purpose: fund.purpose,
    groupId: fund.groupId ?? null,
    groupName: grp?.name ?? null,
    groupSlug: grp?.slug ?? null,
    groupDescription: grp?.description ?? null,
    targetAmount: fund.targetAmount,
    targetMonths: fund.targetMonths,
    currentAmount,
    percentFilled: computePercentFilled(currentAmount, fund.targetAmount),
    sources,
    goalId: fund.goalId,
    color: fund.color,
    icon: fund.icon,
    order: fund.order,
    archivedAt: fund.archivedAt,
    createdAt: fund.createdAt,
    updatedAt: fund.updatedAt,
  };
}

async function enrichMany(
  userId: string,
  funds: Awaited<ReturnType<typeof FundsRepository.findMany>>,
) {
  const allAccountIds = [...new Set(funds.flatMap((f) => f.sources.map((s) => s.accountId)))];
  const accountMap = await loadAccountMap(userId, allAccountIds);
  const balanceMap = new Map([...accountMap.entries()].map(([id, a]) => [id, a.balance]));
  const groupMap = await loadGroupMap(
    funds.map((f) => f.groupId).filter((id): id is string => !!id),
  );
  const noSourceFundIds = funds.filter((f) => f.sources.length === 0).map((f) => f.id);
  const transferBalances = await TransactionRepository.sumTransfersByFund(
    userId,
    noSourceFundIds,
  );

  return funds.map((fund) => {
    const currentAmount =
      fund.sources.length > 0
        ? computeFundCurrentAmount(fund.sources, balanceMap)
        : (transferBalances.get(fund.id) ?? 0);
    const grp = fund.groupId ? groupMap.get(fund.groupId) : undefined;
    return {
      id: fund.id,
      name: fund.name,
      purpose: fund.purpose,
      groupId: fund.groupId ?? null,
      groupName: grp?.name ?? null,
      groupSlug: grp?.slug ?? null,
      groupDescription: grp?.description ?? null,
      targetAmount: fund.targetAmount,
      targetMonths: fund.targetMonths,
      currentAmount,
      percentFilled: computePercentFilled(currentAmount, fund.targetAmount),
      sources: buildSourceBreakdown(fund.sources, accountMap),
      goalId: fund.goalId,
      color: fund.color,
      icon: fund.icon,
      order: fund.order,
      archivedAt: fund.archivedAt,
      createdAt: fund.createdAt,
      updatedAt: fund.updatedAt,
    } satisfies FundSummary;
  });
}

export const FundsService = {
  async list(userId: string, query: ListFundsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [funds, total] = await Promise.all([
      FundsRepository.findMany(userId, {
        skip,
        take: limit,
        sort: query.sort ?? 'order_asc',
        includeArchived: query.includeArchived,
        purpose: query.purpose,
      }),
      FundsRepository.countMany(userId, {
        includeArchived: query.includeArchived,
        purpose: query.purpose,
      }),
    ]);

    let summaries = await enrichMany(userId, funds);

    if (query.sort === 'fill_asc') {
      summaries = [...summaries].sort((a, b) => a.percentFilled - b.percentFilled);
    } else if (query.sort === 'fill_desc') {
      summaries = [...summaries].sort((a, b) => b.percentFilled - a.percentFilled);
    }

    return { data: summaries, meta: buildMeta(page, limit, total) };
  },

  async create(userId: string, dto: CreateFundDto) {
    const accountIds = dto.sources?.map((s) => s.accountId) ?? [];
    if (accountIds.length > 0) {
      const accounts = await FundsRepository.findAccountsByIds(userId, accountIds);
      if (accounts.length !== accountIds.length) {
        throw new NotFoundError('One or more source accounts not found');
      }
    }

    const maxOrder = await FundsRepository.maxOrder(userId);
    const order = dto.order ?? (maxOrder._max?.order ?? -1) + 1;

    const created = await FundsRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      purpose: dto.purpose,
      ...(dto.groupId && { group: { connect: { id: dto.groupId } } }),
      targetAmount: dto.targetAmount ?? 0,
      targetMonths: dto.targetMonths,
      order,
      color: dto.color,
      icon: dto.icon,
      ...(dto.goalId && { goalId: dto.goalId }),
    });

    if (dto.sources?.length) {
      const withSources = await FundsRepository.update(created.id, {
        sources: normalizeSources(created.id, dto.sources),
      });
      return enrichFund(userId, withSources);
    }

    return enrichFund(userId, created);
  },

  async get(id: string, userId: string): Promise<FundSummary> {
    const fund = await FundsRepository.findById(id);
    assertOwned(fund, userId);
    return enrichFund(userId, fund);
  },

  async archive(id: string, userId: string) {
    const existing = await FundsRepository.findById(id);
    assertOwned(existing, userId);
    await FundsRepository.update(id, { archivedAt: new Date() });
  },

  async hardDelete(id: string, userId: string) {
    const existing = await FundsRepository.findById(id);
    assertOwned(existing, userId);
    await FundsRepository.hardDelete(id);
  },

  async update(id: string, userId: string, dto: UpdateFundDto) {
    const existing = await FundsRepository.findById(id);
    assertOwned(existing, userId);

    if (dto.sources) {
      const accountIds = dto.sources.map((s) => s.accountId);
      const accounts = await FundsRepository.findAccountsByIds(userId, accountIds);
      if (accounts.length !== accountIds.length) {
        throw new NotFoundError('One or more source accounts not found');
      }
    }

    const updated = await FundsRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.purpose !== undefined && { purpose: dto.purpose }),
      ...(dto.groupId !== undefined && { group: { connect: { id: dto.groupId } } }),
      ...(dto.targetAmount !== undefined && { targetAmount: dto.targetAmount }),
      ...(dto.targetMonths !== undefined && { targetMonths: dto.targetMonths }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(dto.goalId !== undefined && { goalId: dto.goalId }),
      ...(dto.sources !== undefined && { sources: normalizeSources(id, dto.sources) }),
    });

    return enrichFund(userId, updated);
  },

  async allocate(id: string, userId: string, dto: AllocateFundDto) {
    const fund = await FundsRepository.findById(id);
    assertOwned(fund, userId);

    const account = await FundsRepository.findAccountsByIds(userId, [dto.accountId]);
    if (account.length === 0) throw new NotFoundError('Account not found');

    const sources = [...fund.sources.filter((s) => s.accountId !== dto.accountId)];
    sources.push({
      fundId: id,
      accountId: dto.accountId,
      type: dto.type,
      value: dto.value,
      priority: dto.priority ?? 0,
    });
    sources.sort((a, b) => a.priority - b.priority);

    const updated = await FundsRepository.update(id, { sources });
    return enrichFund(userId, updated);
  },

  async saveAllocations(id: string, userId: string, sources: AllocateFundDto[]) {
    const fund = await FundsRepository.findById(id);
    assertOwned(fund, userId);

    if (sources.length > 0) {
      const accountIds = sources.map((s) => s.accountId);
      const accounts = await FundsRepository.findAccountsByIds(userId, accountIds);
      if (accounts.length !== accountIds.length) {
        throw new NotFoundError('One or more source accounts not found');
      }
    }

    const updated = await FundsRepository.update(id, {
      sources: normalizeSources(id, sources),
    });
    return enrichFund(userId, updated);
  },

  async removeAllocation(id: string, userId: string, accountId: string) {
    const fund = await FundsRepository.findById(id);
    assertOwned(fund, userId);

    const nextSources = fund.sources.filter((s) => s.accountId !== accountId);
    if (nextSources.length === fund.sources.length) {
      throw new FundAllocationNotFoundError();
    }

    const updated = await FundsRepository.update(id, { sources: nextSources });
    return enrichFund(userId, updated);
  },

  async getSummary(userId: string): Promise<FundsAggregateSummary> {
    const [funds, accounts] = await Promise.all([
      FundsRepository.findAllActive(userId),
      FundsRepository.findUserAccounts(userId),
    ]);

    const balanceMap = new Map(accounts.map((a) => [a.id, a.balance]));
    const allSources = funds.flatMap((f) => f.sources);

    let totalAllocated = 0;
    let totalTarget = 0;
    const fundHealthRadar = funds.map((fund) => {
      const currentAmount = computeFundCurrentAmount(fund.sources, balanceMap);
      const percentFilled = computePercentFilled(currentAmount, fund.targetAmount);
      totalAllocated += currentAmount;
      totalTarget += fund.targetAmount;
      return {
        id: fund.id,
        name: fund.name,
        purpose: fund.purpose,
        currentAmount,
        targetAmount: fund.targetAmount,
        percentFilled,
        health: resolveFundHealth(percentFilled),
      };
    });

    const totalUnallocated = computeIdleCash(accounts, allSources, balanceMap);
    const overallFillPercent =
      totalTarget > 0 ? Math.min(100, Math.round((totalAllocated / totalTarget) * 100)) : 0;

    return {
      totalAllocated: Math.round(totalAllocated * 100) / 100,
      totalUnallocated,
      totalTarget,
      overallFillPercent,
      fundHealthRadar,
      currency: 'INR',
    };
  },

  async setupDefaults(userId: string): Promise<{ created: number }> {
    const existing = await FundsRepository.countMany(userId, { includeArchived: false });
    if (existing > 0) return { created: 0 };

    // 1. Create system fund groups for this user
    const groupMap = new Map<string, string>(); // slug → groupId
    const maxGroupOrder = await FundGroupsRepository.maxOrder(userId);
    let nextGroupOrder = (maxGroupOrder._max?.order ?? -1) + 1;

    for (const grp of DEFAULT_GROUPS) {
      const created = await FundGroupsRepository.create({
        user: { connect: { id: userId } },
        name: grp.name,
        description: grp.description,
        slug: grp.slug,
        purposeHint: grp.purposeHint,
        color: grp.color,
        order: nextGroupOrder++,
        isSystem: true,
      });
      groupMap.set(grp.slug, created.id);
    }

    // 2. Create default funds linked to their groups
    const maxOrder = await FundsRepository.maxOrder(userId);
    let nextOrder = (maxOrder._max?.order ?? -1) + 1;
    let created = 0;

    for (const fund of DEFAULT_FUNDS) {
      const groupId = groupMap.get(fund.groupSlug);
      await FundsRepository.create({
        user: { connect: { id: userId } },
        name: fund.name,
        purpose: fund.purpose,
        ...(groupId && { group: { connect: { id: groupId } } }),
        targetAmount: fund.targetAmount,
        color: fund.color,
        order: nextOrder++,
      });
      created++;
    }

    return { created };
  },
};
