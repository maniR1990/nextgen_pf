import {
  AccountArchiveBlockedError,
  AccountNotFoundError,
  ConflictError,
  NotFoundError,
} from '@/lib/api/errors';
import { buildMeta } from '@/lib/api/pagination';
import {
  BALANCE_ADJUSTMENT_MERCHANT,
  RECENT_ACTIVITY_LIMIT,
  UPCOMING_EVENTS_DAYS,
} from '@/constants/accounts';
import { AccountsRepository } from './accounts.repository';
import type {
  AccountDetail,
  AccountGroupWithAccounts,
  AccountHealth,
  AccountSummary,
  CreateAccountDto,
  ListAccountsQuery,
  NetWorthSummary,
  UpdateAccountDto,
} from './accounts.types';
import { buildAccountCode, computeAccountHealth } from './lib/account-code';
import { computeFundAllocationAmounts, computeFundFillPercent } from './lib/fund-amounts';
import { computeNetWorth } from './lib/net-worth';

function assertOwned(account: { userId: string }, userId: string) {
  if (account.userId !== userId) throw new AccountNotFoundError();
}

function toSummary(row: Omit<AccountSummary, never> & Record<string, unknown>): AccountSummary {
  return {
    id: row.id as string,
    name: row.name as string,
    code: row.code as string,
    type: row.type as AccountSummary['type'],
    subtype: (row.subtype as string | null) ?? null,
    balance: row.balance as number,
    currency: row.currency as string,
    status: row.status as AccountSummary['status'],
    isPrimary: row.isPrimary as boolean,
    isExcludeNetWorth: row.isExcludeNetWorth as boolean,
    isHidden: row.isHidden as boolean,
    institutionId: (row.institutionId as string | null) ?? null,
    groupId: row.groupId as string,
    archivedAt: (row.archivedAt as Date | null) ?? null,
  };
}

function enrichDetail(
  account: Awaited<ReturnType<typeof AccountsRepository.findById>>,
  linkedAccounts: AccountSummary[],
  recentActivity: Awaited<ReturnType<typeof AccountsRepository.findRecentTransactions>>,
): AccountDetail {
  const fundAllocations = computeFundAllocationAmounts(
    account.balance,
    account.fundAllocations ?? [],
  );

  return {
    ...toSummary(account),
    openingBalance: account.openingBalance,
    balanceAsOf: account.balanceAsOf,
    accountNumber: account.accountNumber,
    ifscCode: account.ifscCode,
    upiId: account.upiId,
    creditLimit: account.creditLimit,
    billingCycle: account.billingCycle,
    interestRate: account.interestRate,
    minimumPayment: account.minimumPayment,
    investedAmount: account.investedAmount,
    currentValue: account.currentValue,
    absoluteReturn: account.absoluteReturn,
    xirr: account.xirr,
    maturityDate: account.maturityDate,
    lockInMonths: account.lockInMonths,
    expectedReturn: account.expectedReturn,
    category80C: account.category80C,
    principalAmount: account.principalAmount,
    emi: account.emi,
    remainingEmis: account.remainingEmis,
    interestPaidTotal: account.interestPaidTotal,
    fundAllocations,
    linkedAccounts,
    recentActivity,
    color: account.color,
    icon: account.icon,
    note: account.note,
    tags: account.tags,
    openedOn: account.openedOn,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

async function generateCode(
  userId: string,
  type: CreateAccountDto['type'],
  institutionId?: string,
): Promise<string> {
  let shortName: string | undefined;
  if (institutionId) {
    const inst = await AccountsRepository.findInstitutionById(institutionId);
    shortName = inst?.shortName;
  }
  const prefix = buildAccountCode(shortName, type, 1).slice(0, -2);
  const count = await AccountsRepository.countByUserAndCodePrefix(userId, prefix);
  return buildAccountCode(shortName, type, count + 1);
}

function budgetPeriodFromDate(date: Date) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export const AccountsService = {
  async list(userId: string, query: ListAccountsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const sort = query.sort ?? 'name_asc';

    const [groups, accounts, total, netWorthRows] = await Promise.all([
      AccountsRepository.findGroupsByUserId(userId),
      AccountsRepository.findMany(userId, {
        skip,
        take: limit,
        sort,
        includeArchived: query.includeArchived,
        groupId: query.groupId,
        type: query.type,
      }),
      AccountsRepository.countMany(userId, {
        includeArchived: query.includeArchived,
        groupId: query.groupId,
        type: query.type,
      }),
      AccountsRepository.findAllForNetWorth(userId, query.includeArchived),
    ]);

    const netWorth: NetWorthSummary = computeNetWorth(
      netWorthRows.map((row) => ({
        balance: row.balance,
        isExcludeNetWorth: row.isExcludeNetWorth,
        groupType: row.group.type,
      })),
      netWorthRows[0]?.currency ?? 'INR',
    );

    const groupMap = new Map<string, AccountGroupWithAccounts>();
    for (const group of groups) {
      groupMap.set(group.id, {
        id: group.id,
        name: group.name,
        type: group.type,
        slug: group.slug,
        order: group.order,
        icon: group.icon,
        color: group.color,
        isDefault: group.isDefault,
        isCollapsed: group.isCollapsed,
        accounts: [],
      });
    }

    for (const row of accounts) {
      const bucket = groupMap.get(row.groupId);
      if (bucket) {
        bucket.accounts.push(toSummary(row));
      }
    }

    const data = [...groupMap.values()].filter(
      (group) => group.accounts.length > 0 || !query.groupId,
    );

    return {
      data,
      meta: {
        ...buildMeta(page, limit, total),
        netWorth,
      },
    };
  },

  async create(userId: string, dto: CreateAccountDto) {
    const group = await AccountsRepository.findGroupById(dto.groupId);
    if (!group || group.userId !== userId) {
      throw new NotFoundError('Account group not found');
    }

    const code = await generateCode(userId, dto.type, dto.institutionId);
    const balance = dto.balance ?? 0;

    const created = await AccountsRepository.create({
      userId,
      groupId: dto.groupId,
      ...(dto.institutionId && { institutionId: dto.institutionId }),
      name: dto.name,
      code,
      type: dto.type,
      subtype: dto.subtype,
      balance,
      openingBalance: dto.openingBalance ?? balance,
      currency: dto.currency ?? 'INR',
      balanceAsOf: new Date(),
      archivedAt: null,
      accountNumber: dto.accountNumber,
      ifscCode: dto.ifscCode,
      upiId: dto.upiId,
      creditLimit: dto.creditLimit,
      billingCycle: dto.billingCycle,
      interestRate: dto.interestRate,
      minimumPayment: dto.minimumPayment,
      linkedAccountIds: dto.linkedAccountIds ?? [],
      isPrimary: dto.isPrimary ?? false,
      isExcludeNetWorth: dto.isExcludeNetWorth ?? false,
      isHidden: dto.isHidden ?? false,
      color: dto.color,
      icon: dto.icon,
      note: dto.note,
      tags: dto.tags ?? [],
      openedOn: dto.openedOn ? new Date(dto.openedOn) : new Date(),
    });

    if (dto.fundAllocations?.length) {
      const withAllocations = await AccountsRepository.update(created.id, {
        fundAllocations: dto.fundAllocations.map((row) => ({
          fundId: row.fundId,
          accountId: created.id,
          type: row.type,
          value: row.value,
          priority: row.priority ?? 0,
        })),
      });
      return enrichDetail(withAllocations, [], []);
    }

    return enrichDetail(created, [], []);
  },

  async getById(id: string, userId: string) {
    const account = await AccountsRepository.findById(id);
    assertOwned(account, userId);

    const [linkedAccounts, recentActivity] = await Promise.all([
      account.linkedAccountIds.length > 0
        ? AccountsRepository.findSummariesByIds(account.linkedAccountIds, userId)
        : Promise.resolve([]),
      AccountsRepository.findRecentTransactions(id, RECENT_ACTIVITY_LIMIT),
    ]);

    return enrichDetail(account, linkedAccounts.map(toSummary), recentActivity);
  },

  async update(id: string, userId: string, dto: UpdateAccountDto) {
    const existing = await AccountsRepository.findById(id);
    assertOwned(existing, userId);

    if (dto.groupId) {
      const group = await AccountsRepository.findGroupById(dto.groupId);
      if (!group || group.userId !== userId) {
        throw new NotFoundError('Account group not found');
      }
    }

    const updated = await AccountsRepository.update(id, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.groupId !== undefined && { groupId: dto.groupId }),
      ...(dto.institutionId !== undefined && { institutionId: dto.institutionId ?? null }),
      ...(dto.subtype !== undefined && { subtype: dto.subtype }),
      ...(dto.balance !== undefined && { balance: dto.balance, balanceAsOf: new Date() }),
      ...(dto.openingBalance !== undefined && { openingBalance: dto.openingBalance }),
      ...(dto.currency !== undefined && { currency: dto.currency }),
      ...(dto.accountNumber !== undefined && { accountNumber: dto.accountNumber }),
      ...(dto.ifscCode !== undefined && { ifscCode: dto.ifscCode }),
      ...(dto.upiId !== undefined && { upiId: dto.upiId }),
      ...(dto.creditLimit !== undefined && { creditLimit: dto.creditLimit }),
      ...(dto.billingCycle !== undefined && { billingCycle: dto.billingCycle }),
      ...(dto.interestRate !== undefined && { interestRate: dto.interestRate }),
      ...(dto.minimumPayment !== undefined && { minimumPayment: dto.minimumPayment }),
      ...(dto.investedAmount !== undefined && { investedAmount: dto.investedAmount }),
      ...(dto.currentValue !== undefined && { currentValue: dto.currentValue }),
      ...(dto.absoluteReturn !== undefined && { absoluteReturn: dto.absoluteReturn }),
      ...(dto.xirr !== undefined && { xirr: dto.xirr }),
      ...(dto.maturityDate !== undefined && { maturityDate: new Date(dto.maturityDate) }),
      ...(dto.lockInMonths !== undefined && { lockInMonths: dto.lockInMonths }),
      ...(dto.expectedReturn !== undefined && { expectedReturn: dto.expectedReturn }),
      ...(dto.category80C !== undefined && { category80C: dto.category80C }),
      ...(dto.principalAmount !== undefined && { principalAmount: dto.principalAmount }),
      ...(dto.emi !== undefined && { emi: dto.emi }),
      ...(dto.remainingEmis !== undefined && { remainingEmis: dto.remainingEmis }),
      ...(dto.interestPaidTotal !== undefined && { interestPaidTotal: dto.interestPaidTotal }),
      ...(dto.fundAllocations !== undefined && {
        fundAllocations: dto.fundAllocations.map((row) => ({
          fundId: row.fundId,
          accountId: row.accountId ?? id,
          type: row.type,
          value: row.value,
          priority: row.priority ?? 0,
        })),
      }),
      ...(dto.linkedAccountIds !== undefined && { linkedAccountIds: dto.linkedAccountIds }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
      ...(dto.isExcludeNetWorth !== undefined && { isExcludeNetWorth: dto.isExcludeNetWorth }),
      ...(dto.isHidden !== undefined && { isHidden: dto.isHidden }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.note !== undefined && { note: dto.note }),
      ...(dto.tags !== undefined && { tags: dto.tags }),
      ...(dto.openedOn !== undefined && { openedOn: new Date(dto.openedOn) }),
    });

    const linkedAccounts =
      updated.linkedAccountIds.length > 0
        ? await AccountsRepository.findSummariesByIds(updated.linkedAccountIds, userId)
        : [];

    return enrichDetail(updated, linkedAccounts.map(toSummary), []);
  },

  async patchBalance(
    id: string,
    userId: string,
    balance: number,
    options?: { note?: string; date?: string },
  ) {
    const account = await AccountsRepository.findById(id);
    assertOwned(account, userId);

    const delta = balance - account.balance;
    if (delta === 0) {
      return enrichDetail(account, [], []);
    }

    const txDate = options?.date ? new Date(options.date) : new Date();
    const { year, month } = budgetPeriodFromDate(txDate);

    const result = await AccountsRepository.runTransaction(async (tx) => {
      await tx.financeTransaction.create({
        data: {
          user: { connect: { id: userId } },
          account: { connect: { id } },
          type: delta > 0 ? 'INCOME' : 'EXPENSE',
          date: txDate,
          budgetPeriodYear: year,
          budgetPeriodMonth: month,
          amount: Math.abs(delta),
          paymentMethod: 'AUTO_DEBIT',
          isPlanned: false,
          isRecurring: false,
          status: 'CLEARED',
          merchant: BALANCE_ADJUSTMENT_MERCHANT,
          notes: options?.note ?? `Balance adjusted from ₹${account.balance} to ₹${balance}`,
        },
      });

      await tx.account.update({
        where: { id },
        data: { balance, balanceAsOf: txDate },
      });
    });

    return this.getById(id, userId);
  },

  async deleteById(id: string, userId: string) {
    const account = await AccountsRepository.findById(id);
    assertOwned(account, userId);
    await AccountsRepository.deleteById(id);
  },

  async archive(id: string, userId: string) {
    const account = await AccountsRepository.findById(id);
    assertOwned(account, userId);

    if (account.archivedAt) {
      throw new ConflictError('Account is already archived');
    }

    if (account.remainingEmis && account.remainingEmis > 0) {
      throw new AccountArchiveBlockedError('pending EMIs remain on this loan account');
    }

    const hasActiveAllocations = (account.fundAllocations ?? []).some(
      (row) => row.type === 'FIXED' ? row.value > 0 : row.value > 0,
    );
    if (hasActiveAllocations) {
      throw new AccountArchiveBlockedError('active fund allocations exist on this account');
    }

    const archived = await AccountsRepository.archive(id);
    return enrichDetail(archived, [], []);
  },

  async transfer(
    fromAccountId: string,
    userId: string,
    input: { toAccountId: string; amount: number; note?: string; date?: string },
  ) {
    if (fromAccountId === input.toAccountId) {
      throw new ConflictError('Cannot transfer to the same account');
    }

    const [fromAccount, toAccount] = await Promise.all([
      AccountsRepository.findById(fromAccountId),
      AccountsRepository.findById(input.toAccountId),
    ]);

    assertOwned(fromAccount, userId);
    assertOwned(toAccount, userId);

    if (fromAccount.archivedAt || toAccount.archivedAt) {
      throw new ConflictError('Cannot transfer involving archived accounts');
    }

    const txDate = input.date ? new Date(input.date) : new Date();
    const { year, month } = budgetPeriodFromDate(txDate);

    const result = await AccountsRepository.runTransaction(async (tx) => {
      await tx.financeTransaction.create({
        data: {
          user: { connect: { id: userId } },
          account: { connect: { id: fromAccountId } },
          toAccount: { connect: { id: input.toAccountId } },
          type: 'TRANSFER',
          date: txDate,
          budgetPeriodYear: year,
          budgetPeriodMonth: month,
          amount: input.amount,
          paymentMethod: 'NEFT',
          isPlanned: false,
          isRecurring: false,
          status: 'CLEARED',
          notes: input.note,
        },
      });

      const [updatedFrom, updatedTo] = await Promise.all([
        tx.account.update({
          where: { id: fromAccountId },
          data: {
            balance: fromAccount.balance - input.amount,
            balanceAsOf: txDate,
          },
          select: { id: true, balance: true },
        }),
        tx.account.update({
          where: { id: input.toAccountId },
          data: {
            balance: toAccount.balance + input.amount,
            balanceAsOf: txDate,
          },
          select: { id: true, balance: true },
        }),
      ]);

      return { updatedFrom, updatedTo };
    });

    return result;
  },

  async getHealth(id: string, userId: string): Promise<AccountHealth> {
    const account = await AccountsRepository.findById(id);
    assertOwned(account, userId);

    const fundAllocations = computeFundAllocationAmounts(
      account.balance,
      account.fundAllocations ?? [],
    );
    const fundFillPercent = computeFundFillPercent(fundAllocations);
    const fundIds = fundAllocations.map((row) => row.fundId);

    const now = new Date();
    const horizon = new Date(now.getTime() + UPCOMING_EVENTS_DAYS * 86_400_000);

    const upcomingEvents =
      fundIds.length > 0
        ? await AccountsRepository.findUpcomingEventsForAccount(userId, fundIds, now, horizon)
        : [];

    return computeAccountHealth({
      balance: account.balance,
      type: account.type,
      creditLimit: account.creditLimit,
      archivedAt: account.archivedAt,
      fundFillPercent,
      upcomingEvents,
    });
  },
};
