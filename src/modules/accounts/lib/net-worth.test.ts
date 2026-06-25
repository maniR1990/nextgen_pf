import { describe, it, expect } from 'vitest';
import { computeNetWorth } from './net-worth';

describe('computeNetWorth', () => {
  it('sums assets and subtracts liabilities', () => {
    const result = computeNetWorth([
      { balance: 100000, isExcludeNetWorth: false, groupType: 'ASSET' },
      { balance: 25000, isExcludeNetWorth: false, groupType: 'LIABILITY' },
    ]);
    expect(result).toEqual({
      totalAssets: 100000,
      totalLiabilities: 25000,
      netWorth: 75000,
      currency: 'INR',
    });
  });

  it('excludes accounts flagged isExcludeNetWorth', () => {
    const result = computeNetWorth([
      { balance: 50000, isExcludeNetWorth: true, groupType: 'ASSET' },
      { balance: 20000, isExcludeNetWorth: false, groupType: 'ASSET' },
    ]);
    expect(result.netWorth).toBe(20000);
  });
});
