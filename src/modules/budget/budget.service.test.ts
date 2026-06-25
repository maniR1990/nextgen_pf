import { describe, expect, it, vi } from 'vitest';
import { BUDGET_SUMMARY_ID } from '@/constants/budget';
import { buildBudgetLedgerPayload, computeBudgetMetrics } from './budget.tree';
import { BudgetService } from './budget.service';
import { BudgetRepository } from './budget.repository';
import type { BudgetLineRecord } from './budget.types';

vi.mock('./budget.repository', () => ({
  BudgetRepository: {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    findDescendantIds: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
}));

const userId = 'user-1';

function line(partial: Partial<BudgetLineRecord> & Pick<BudgetLineRecord, 'id' | 'title' | 'kind'>): BudgetLineRecord {
  return {
    userId,
    parentId: null,
    variant: null,
    plannedMinor: 0,
    spentMinor: 0,
    sortOrder: 0,
    tag: null,
    note: null,
    typeLabel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

describe('budget.tree', () => {
  it('computeBudgetMetrics derives remaining and percent', () => {
    expect(computeBudgetMetrics(10_000, 5_400)).toEqual({
      plannedMinor: 10_000,
      spentMinor: 5_400,
      remainingMinor: 4_600,
      percent: 54,
    });
  });

  it('buildBudgetLedgerPayload nests children and computes summaries', () => {
    const flat: BudgetLineRecord[] = [
      line({
        id: 'income',
        title: 'INCOME',
        kind: 'SECTION',
        variant: 'INCOME',
        plannedMinor: 220_000_00,
        spentMinor: 0,
        sortOrder: 0,
      }),
      line({
        id: 'household',
        title: 'HOUSEHOLD ESSENTIALS',
        kind: 'SECTION',
        variant: 'HOUSEHOLD',
        plannedMinor: 35_420_00,
        spentMinor: 0,
        sortOrder: 1,
      }),
      line({
        id: 'invest',
        title: 'INVESTMENTS & GOALS',
        kind: 'SECTION',
        variant: 'INVESTMENTS',
        plannedMinor: 120_000_00,
        spentMinor: 120_000_00,
        sortOrder: 2,
      }),
    ];

    const payload = buildBudgetLedgerPayload(flat);
    expect(payload.rows).toHaveLength(3);
    expect(payload.summaries.find((s) => s.id === BUDGET_SUMMARY_ID.SURPLUS)).toMatchObject({
      plannedMinor: 220_000_00 - (35_420_00 + 120_000_00),
    });
  });
});

describe('BudgetService', () => {
  it('getLedger returns tree payload for user', async () => {
    vi.mocked(BudgetRepository.findByUserId).mockResolvedValue([
      line({ id: 'a', title: 'INCOME', kind: 'SECTION', variant: 'INCOME' }),
    ]);

    const result = await BudgetService.getLedger(userId);
    expect(result.rows).toHaveLength(1);
    expect(result.summaries.length).toBeGreaterThan(0);
  });
});
