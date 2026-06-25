import type { AccountGroupType } from '@prisma/client';
import type { NetWorthSummary } from '../accounts.types';

interface NetWorthInput {
  balance: number;
  isExcludeNetWorth: boolean;
  groupType: AccountGroupType;
}

export function computeNetWorth(
  accounts: NetWorthInput[],
  currency = 'INR',
): NetWorthSummary {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const account of accounts) {
    if (account.isExcludeNetWorth) continue;
    const amount = Math.abs(account.balance);
    if (account.groupType === 'LIABILITY') {
      totalLiabilities += amount;
    } else {
      totalAssets += account.balance;
    }
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    currency,
  };
}
