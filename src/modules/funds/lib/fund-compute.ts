import type { FundAllocation } from '@prisma/client';
import type { SourceBreakdown } from '../funds.types';

export function computeAllocationAmount(
  type: FundAllocation['type'],
  value: number,
  accountBalance: number,
): number {
  if (type === 'PERCENTAGE') {
    return Math.round(accountBalance * value * 100) / 100;
  }
  return Math.min(value, Math.max(accountBalance, 0));
}

export function computeFundCurrentAmount(
  sources: FundAllocation[],
  accountBalances: Map<string, number>,
): number {
  return (
    Math.round(
      sources.reduce((sum, src) => {
        const balance = accountBalances.get(src.accountId) ?? 0;
        return sum + computeAllocationAmount(src.type, src.value, balance);
      }, 0) * 100,
    ) / 100
  );
}

export function computePercentFilled(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return currentAmount > 0 ? 100 : 0;
  return Math.min(100, Math.round((currentAmount / targetAmount) * 100));
}

export function buildSourceBreakdown(
  sources: FundAllocation[],
  accounts: Map<string, { name: string; code: string; balance: number }>,
): SourceBreakdown[] {
  return sources.map((src) => {
    const account = accounts.get(src.accountId);
    const accountBalance = account?.balance ?? 0;
    return {
      accountId: src.accountId,
      accountName: account?.name ?? 'Unknown',
      accountCode: account?.code ?? '',
      type: src.type,
      value: src.value,
      priority: src.priority,
      allocatedAmount: computeAllocationAmount(src.type, src.value, accountBalance),
      accountBalance,
    };
  });
}

export function computeIdleCash(
  accounts: Array<{ id: string; balance: number }>,
  allSources: FundAllocation[],
  accountBalances: Map<string, number>,
): number {
  const allocatedByAccount = new Map<string, number>();

  for (const src of allSources) {
    const balance = accountBalances.get(src.accountId) ?? 0;
    const amount = computeAllocationAmount(src.type, src.value, balance);
    allocatedByAccount.set(src.accountId, (allocatedByAccount.get(src.accountId) ?? 0) + amount);
  }

  let idle = 0;
  for (const account of accounts) {
    const balance = accountBalances.get(account.id) ?? account.balance;
    const allocated = allocatedByAccount.get(account.id) ?? 0;
    idle += Math.max(0, balance - allocated);
  }

  return Math.round(idle * 100) / 100;
}

export function resolveFundHealth(percentFilled: number): 'healthy' | 'ok' | 'low' | 'empty' {
  if (percentFilled >= 100) return 'healthy';
  if (percentFilled >= 50) return 'ok';
  if (percentFilled > 0) return 'low';
  return 'empty';
}
