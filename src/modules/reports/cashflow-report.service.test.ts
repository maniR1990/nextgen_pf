import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPeriodTotals } from '@/modules/transactions/period-spend';
import type { PeriodTotals } from '@/modules/transactions/period-spend';
import { CashflowReportRepository } from './cashflow-report.repository';
import { CashflowReportService } from './cashflow-report.service';

vi.mock('./cashflow-report.repository');
vi.mock('@/modules/transactions/period-spend');

beforeEach(() => vi.clearAllMocks());

function mockPeriodTotals(overrides: Partial<PeriodTotals> = {}) {
  vi.mocked(getPeriodTotals).mockResolvedValue({
    totalIncome: 0,
    totalExpense: 0,
    totalExpenseOnly: 0,
    net: 0,
    totalsByType: {},
    uncategorizedByType: {},
    ...overrides,
  });
}

// ── getMonthlyReport ──────────────────────────────────────────────────────────

describe('CashflowReportService.getMonthlyReport', () => {
  it('returns totalIncome as sum of income-type transactions', async () => {
    mockPeriodTotals({ totalIncome: 100000 });
    vi.mocked(CashflowReportRepository.fundGroupBreakdown).mockResolvedValue([]);

    const report = await CashflowReportService.getMonthlyReport('u1', 2026, 6);
    expect(report.totalIncome).toBe(100000);
  });

  it('returns savingsBreakdown grouped by fund group for IN flow', async () => {
    mockPeriodTotals();
    vi.mocked(CashflowReportRepository.fundGroupBreakdown).mockImplementation(
      async (_userId, _year, _month, flow) => {
        if (flow === 'IN') {
          return [
            { fundGroupId: 'fg1', fundGroupName: 'Emergency', totalAmount: 15000 },
            { fundGroupId: 'fg2', fundGroupName: 'Wealth', totalAmount: 10000 },
          ];
        }
        return [];
      },
    );

    const report = await CashflowReportService.getMonthlyReport('u1', 2026, 6);
    expect(report.savingsBreakdown).toHaveLength(2);
    expect(report.savingsBreakdown[0]).toMatchObject({
      fundGroupId: 'fg1',
      fundGroupName: 'Emergency',
      totalAmount: 15000,
    });
  });

  it('returns fundUsed grouped by fund group for OUT flow', async () => {
    mockPeriodTotals();
    vi.mocked(CashflowReportRepository.fundGroupBreakdown).mockImplementation(
      async (_userId, _year, _month, flow) => {
        if (flow === 'OUT') {
          return [{ fundGroupId: 'fg1', fundGroupName: 'Emergency', totalAmount: 20000 }];
        }
        return [];
      },
    );

    const report = await CashflowReportService.getMonthlyReport('u1', 2026, 6);
    expect(report.fundUsed).toHaveLength(1);
    expect(report.fundUsed[0]).toMatchObject({
      fundGroupId: 'fg1',
      totalAmount: 20000,
    });
  });

  it('computes remaining = (income + fundUsed) - savings - expenses - ATM', async () => {
    // income=100000, savingsIN=25000, fundUsedOUT=20000, expenses=30000, ATM=5000
    // remaining = (100000 + 20000) - 25000 - 30000 - 5000 = 60000
    mockPeriodTotals({
      totalIncome: 100000,
      totalExpenseOnly: 30000,
      totalsByType: { ATM_WITHDRAWAL: 5000 },
    });
    vi.mocked(CashflowReportRepository.fundGroupBreakdown).mockImplementation(
      async (_userId, _year, _month, flow) => {
        if (flow === 'IN')
          return [{ fundGroupId: 'fg1', fundGroupName: 'Emergency', totalAmount: 25000 }];
        if (flow === 'OUT')
          return [{ fundGroupId: 'fg1', fundGroupName: 'Emergency', totalAmount: 20000 }];
        return [];
      },
    );

    const report = await CashflowReportService.getMonthlyReport('u1', 2026, 6);
    expect(report.remaining).toBe(60000);
  });

  it('returns remaining=0 and null percentages when income=0 and fundUsed=0', async () => {
    mockPeriodTotals();
    vi.mocked(CashflowReportRepository.fundGroupBreakdown).mockResolvedValue([]);

    const report = await CashflowReportService.getMonthlyReport('u1', 2026, 7);
    expect(report.remaining).toBe(0);
    expect(report.savingsPct).toBeNull();
    expect(report.expensesPct).toBeNull();
    expect(report.remainingPct).toBeNull();
  });

  it('uses fundUsed as denominator when income=0 (withdrawal month)', async () => {
    // July: no income, Emergency fund OUT=30000 covers expenses=25000
    mockPeriodTotals({ totalIncome: 0, totalExpenseOnly: 25000 });
    vi.mocked(CashflowReportRepository.fundGroupBreakdown).mockImplementation(
      async (_userId, _year, _month, flow) => {
        if (flow === 'OUT') {
          return [{ fundGroupId: 'fg1', fundGroupName: 'Emergency', totalAmount: 30000 }];
        }
        return [];
      },
    );

    const report = await CashflowReportService.getMonthlyReport('u1', 2026, 7);
    expect(report.totalIncome).toBe(0);
    expect(report.totalFundUsed).toBe(30000);
    expect(report.remaining).toBe(5000);
    expect(report.denominator).toBe(30000);
    // 25000 / 30000 * 100 ≈ 83.3
    expect(report.expensesPct).toBeCloseTo(83.3, 0);
    // 5000 / 30000 * 100 ≈ 16.7
    expect(report.remainingPct).toBeCloseTo(16.7, 0);
  });

  it('does not include tagged TRANSFER in expense total', async () => {
    // Tagged transfers are savings — EXPENSE sum must not include them
    mockPeriodTotals({ totalIncome: 50000, totalExpenseOnly: 10000 });
    vi.mocked(CashflowReportRepository.fundGroupBreakdown).mockImplementation(
      async (_userId, _year, _month, flow) => {
        if (flow === 'IN') {
          return [{ fundGroupId: 'fg1', fundGroupName: 'Emergency', totalAmount: 20000 }];
        }
        return [];
      },
    );

    const report = await CashflowReportService.getMonthlyReport('u1', 2026, 6);
    expect(report.expensesTotal).toBe(10000);
    expect(report.totalSavings).toBe(20000);
    expect(report.remaining).toBe(20000); // 50000 - 20000 - 10000
  });

  it('denominator is income + fundUsed for savings rate calculation', async () => {
    mockPeriodTotals({ totalIncome: 80000 });
    vi.mocked(CashflowReportRepository.fundGroupBreakdown).mockImplementation(
      async (_userId, _year, _month, flow) => {
        if (flow === 'IN')
          return [{ fundGroupId: 'fg1', fundGroupName: 'Emergency', totalAmount: 16000 }];
        if (flow === 'OUT')
          return [{ fundGroupId: 'fg1', fundGroupName: 'Emergency', totalAmount: 5000 }];
        return [];
      },
    );

    const report = await CashflowReportService.getMonthlyReport('u1', 2026, 6);
    // denominator = income + fundUsed = 80000 + 5000 = 85000
    expect(report.denominator).toBe(85000);
  });
});

// ── getFundGroupLifetimeContribution ─────────────────────────────────────────

describe('CashflowReportService.getFundGroupLifetimeContribution', () => {
  it('returns netContributed = totalIn - totalOut', async () => {
    vi.mocked(CashflowReportRepository.lifetimeContribution).mockResolvedValue({
      totalIn: 75000,
      totalOut: 20000,
    });

    const result = await CashflowReportService.getFundGroupLifetimeContribution('u1', 'fg1');
    expect(result.netContributed).toBe(55000);
  });

  it('returns netContributed=0 when no transactions tagged to this group', async () => {
    vi.mocked(CashflowReportRepository.lifetimeContribution).mockResolvedValue({
      totalIn: 0,
      totalOut: 0,
    });

    const result = await CashflowReportService.getFundGroupLifetimeContribution('u1', 'fg1');
    expect(result.netContributed).toBe(0);
  });

  it('computes progressPct against targetAmount', async () => {
    vi.mocked(CashflowReportRepository.lifetimeContribution).mockResolvedValue({
      totalIn: 60000,
      totalOut: 5000,
    });

    const result = await CashflowReportService.getFundGroupLifetimeContribution(
      'u1',
      'fg1',
      120000,
    );
    // net = 55000, target = 120000, pct = 45.8%
    expect(result.progressPct).toBeCloseTo(45.8, 0);
  });

  it('caps progressPct at 100 when overcontributed', async () => {
    vi.mocked(CashflowReportRepository.lifetimeContribution).mockResolvedValue({
      totalIn: 200000,
      totalOut: 0,
    });

    const result = await CashflowReportService.getFundGroupLifetimeContribution(
      'u1',
      'fg1',
      120000,
    );
    expect(result.progressPct).toBe(100);
  });

  it('returns null progressPct when no targetAmount provided', async () => {
    vi.mocked(CashflowReportRepository.lifetimeContribution).mockResolvedValue({
      totalIn: 50000,
      totalOut: 0,
    });

    const result = await CashflowReportService.getFundGroupLifetimeContribution('u1', 'fg1');
    expect(result.progressPct).toBeNull();
  });

  it('returns null progressPct when targetAmount is zero', async () => {
    vi.mocked(CashflowReportRepository.lifetimeContribution).mockResolvedValue({
      totalIn: 50000,
      totalOut: 0,
    });

    const result = await CashflowReportService.getFundGroupLifetimeContribution('u1', 'fg1', 0);
    expect(result.progressPct).toBeNull();
  });
});
