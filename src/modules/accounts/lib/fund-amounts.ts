import type { FundAllocationType } from '@prisma/client';
import type { FundAllocationWithAmount } from '../accounts.types';

interface AllocationInput {
  fundId: string;
  accountId?: string;
  type: FundAllocationType;
  value: number;
  priority?: number;
}

export function computeFundAllocationAmounts(
  balance: number,
  allocations: AllocationInput[],
): FundAllocationWithAmount[] {
  return allocations.map((allocation) => ({
    fundId: allocation.fundId,
    accountId: allocation.accountId,
    type: allocation.type,
    value: allocation.value,
    priority: allocation.priority ?? 0,
    computedAmount:
      allocation.type === 'PERCENTAGE'
        ? Math.round(balance * allocation.value * 100) / 100
        : allocation.value,
  }));
}

export function computeFundFillPercent(allocations: FundAllocationWithAmount[]): number {
  if (allocations.length === 0) return 100;
  const total = allocations.reduce((sum, row) => sum + row.computedAmount, 0);
  const target = allocations.reduce((sum, row) => {
    if (row.type === 'FIXED') return sum + row.value;
    return sum + row.computedAmount;
  }, 0);
  if (target <= 0) return 100;
  return Math.min(100, Math.round((total / target) * 100));
}
