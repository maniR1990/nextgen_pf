import { describe, it, expect } from 'vitest';
import {
  computeAllocationAmount,
  computeFundCurrentAmount,
  computePercentFilled,
  computeIdleCash,
  resolveFundHealth,
} from './fund-compute';

describe('fund-compute', () => {
  it('computes percentage allocation from account balance', () => {
    expect(computeAllocationAmount('PERCENTAGE', 0.4, 100000)).toBe(40000);
  });

  it('caps fixed allocation at account balance', () => {
    expect(computeAllocationAmount('FIXED', 50000, 30000)).toBe(30000);
  });

  it('sums fund current amount across sources', () => {
    const total = computeFundCurrentAmount(
      [
        { fundId: 'f1', accountId: 'a1', type: 'PERCENTAGE', value: 0.2, priority: 0 },
        { fundId: 'f1', accountId: 'a2', type: 'FIXED', value: 10000, priority: 1 },
      ],
      new Map([
        ['a1', 100000],
        ['a2', 50000],
      ]),
    );
    expect(total).toBe(30000);
  });

  it('computes percent filled against target', () => {
    expect(computePercentFilled(75000, 100000)).toBe(75);
    expect(computePercentFilled(120000, 100000)).toBe(100);
  });

  it('computes idle cash after allocations', () => {
    const idle = computeIdleCash(
      [
        { id: 'a1', balance: 100000 },
        { id: 'a2', balance: 20000 },
      ],
      [{ fundId: 'f1', accountId: 'a1', type: 'FIXED', value: 40000, priority: 0 }],
      new Map([
        ['a1', 100000],
        ['a2', 20000],
      ]),
    );
    expect(idle).toBe(80000);
  });

  it('resolves fund health bands', () => {
    expect(resolveFundHealth(100)).toBe('healthy');
    expect(resolveFundHealth(60)).toBe('ok');
    expect(resolveFundHealth(20)).toBe('low');
    expect(resolveFundHealth(0)).toBe('empty');
  });
});
