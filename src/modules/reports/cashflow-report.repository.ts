import { prisma } from '@/lib/db/prisma';

export const CashflowReportRepository = {
  async fundGroupBreakdown(
    userId: string,
    year: number,
    month: number,
    flow: 'IN' | 'OUT',
  ): Promise<Array<{ fundGroupId: string; fundGroupName: string; totalAmount: number }>> {
    const rows = await prisma.financeTransaction.groupBy({
      by: ['fundGroupId'],
      where: {
        userId,
        budgetPeriodYear: year,
        budgetPeriodMonth: month,
        fundGroupId: { not: null },
        fundGroupFlow: flow,
        status: { not: 'VOID' },
      },
      _sum: { amount: true },
    });

    if (rows.length === 0) return [];

    const groupIds = rows.map((r) => r.fundGroupId as string);
    const groups = await prisma.fundGroup.findMany({
      where: { id: { in: groupIds } },
      select: { id: true, name: true },
    });
    const groupMap = new Map(groups.map((g) => [g.id, g.name]));

    return rows.map((r) => ({
      fundGroupId: r.fundGroupId as string,
      fundGroupName: groupMap.get(r.fundGroupId as string) ?? r.fundGroupId ?? '',
      totalAmount: r._sum.amount ?? 0,
    }));
  },

  async lifetimeContribution(
    userId: string,
    fundGroupId: string,
  ): Promise<{ totalIn: number; totalOut: number }> {
    const [inAgg, outAgg] = await Promise.all([
      prisma.financeTransaction.aggregate({
        where: { userId, fundGroupId, fundGroupFlow: 'IN', status: { not: 'VOID' } },
        _sum: { amount: true },
      }),
      prisma.financeTransaction.aggregate({
        where: { userId, fundGroupId, fundGroupFlow: 'OUT', status: { not: 'VOID' } },
        _sum: { amount: true },
      }),
    ]);
    return {
      totalIn: inAgg._sum.amount ?? 0,
      totalOut: outAgg._sum.amount ?? 0,
    };
  },
};
