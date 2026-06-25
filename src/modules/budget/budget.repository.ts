import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export const BudgetRepository = {
  findByUserId: (userId: string) =>
    prisma.budgetLine.findMany({
      where: { userId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),

  findById: (id: string) => prisma.budgetLine.findUnique({ where: { id } }),

  findChildrenIds: async (userId: string, parentId: string): Promise<string[]> => {
    const children = await prisma.budgetLine.findMany({
      where: { userId, parentId },
      select: { id: true },
    });
    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id, ...(await BudgetRepository.findDescendantIds(userId, child.id)));
    }
    return ids;
  },

  findDescendantIds: async (userId: string, rootId: string): Promise<string[]> => {
    const direct = await prisma.budgetLine.findMany({
      where: { userId, parentId: rootId },
      select: { id: true },
    });
    const ids: string[] = [];
    for (const row of direct) {
      ids.push(row.id, ...(await BudgetRepository.findDescendantIds(userId, row.id)));
    }
    return ids;
  },

  create: (data: Prisma.BudgetLineCreateInput) => prisma.budgetLine.create({ data }),

  update: (id: string, data: Prisma.BudgetLineUpdateInput) =>
    prisma.budgetLine.update({ where: { id }, data }),

  deleteMany: (ids: string[]) =>
    prisma.budgetLine.deleteMany({ where: { id: { in: ids } } }),
};
