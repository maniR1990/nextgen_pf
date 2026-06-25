import { isApiError } from '@/lib/api/errors';
import { compose, withAuth } from '@/lib/api/middleware';
import { v1FromApiError, v1Ok } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { NetWorthRepository } from './net-worth.repository';

const log = getLogger('NetWorthRouter');

// ─── GET /net-worth ───────────────────────────────────────────────────────────

export const v1GetNetWorth = compose(withAuth())(async (_req, ctx) => {
  try {
    const userId = ctx.session!.id;
    const accounts = await NetWorthRepository.findAccountsWithGroups(userId);

    const groupTotals = new Map<
      string,
      { id: string; name: string; type: string; totalBalance: number; accountCount: number }
    >();

    let totalAssets = 0;
    let totalLiabilities = 0;
    const currency = accounts[0]?.currency ?? 'INR';

    for (const account of accounts) {
      const { group, balance, isExcludeNetWorth } = account;

      const entry = groupTotals.get(group.id) ?? {
        id: group.id,
        name: group.name,
        type: group.type,
        totalBalance: 0,
        accountCount: 0,
      };
      entry.totalBalance += balance;
      entry.accountCount += 1;
      groupTotals.set(group.id, entry);

      if (!isExcludeNetWorth) {
        if (group.type === 'LIABILITY') {
          totalLiabilities += Math.abs(balance);
        } else {
          totalAssets += balance;
        }
      }
    }

    return v1Ok({
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      currency,
      groups: [...groupTotals.values()].sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (err) {
    log.error('v1GetNetWorth', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

// ─── GET /net-worth/history ───────────────────────────────────────────────────

export const v1GetNetWorthHistory = compose(withAuth())(async (_req, ctx) => {
  try {
    const userId = ctx.session!.id;

    const accounts = await NetWorthRepository.findAccountsWithGroups(userId);

    let currentAssets = 0;
    let currentLiabilities = 0;
    const currency = accounts[0]?.currency ?? 'INR';

    for (const { balance, isExcludeNetWorth, group } of accounts) {
      if (!isExcludeNetWorth) {
        if (group.type === 'LIABILITY') currentLiabilities += Math.abs(balance);
        else currentAssets += balance;
      }
    }

    // Fetch 13 months of transactions to reconstruct 12 months of history
    const since = new Date();
    since.setMonth(since.getMonth() - 12);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const transactions = await NetWorthRepository.findMonthlyTransactionChanges(userId, since);

    // Aggregate income/expense per year-month key
    const changeByMonth = new Map<string, { income: number; expense: number }>();
    for (const tx of transactions) {
      const key = `${tx.budgetPeriodYear}-${String(tx.budgetPeriodMonth).padStart(2, '0')}`;
      const entry = changeByMonth.get(key) ?? { income: 0, expense: 0 };
      if (tx.type === 'INCOME') {
        entry.income += tx.amount;
      } else {
        entry.expense += tx.amount;
      }
      changeByMonth.set(key, entry);
    }

    // Build history walking backward from current month
    const now = new Date();
    const history: Array<{
      year: number;
      month: number;
      totalAssets: number;
      totalLiabilities: number;
      netWorth: number;
      currency: string;
    }> = [];

    let runningAssets = currentAssets;
    const runningLiabilities = currentLiabilities;

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      history.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        totalAssets: Math.round(runningAssets),
        totalLiabilities: Math.round(runningLiabilities),
        netWorth: Math.round(runningAssets - runningLiabilities),
        currency,
      });

      // Walk back: undo this month's transactions to get previous month end state
      const change = changeByMonth.get(key);
      if (change) {
        runningAssets -= change.income;
        runningAssets += change.expense;
      }
    }

    history.reverse(); // oldest first

    return v1Ok(history);
  } catch (err) {
    log.error('v1GetNetWorthHistory', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
