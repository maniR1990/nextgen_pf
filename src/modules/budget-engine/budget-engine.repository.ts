import { prisma } from '@/lib/db/prisma';

export const BudgetEngineRepository = {
  findCategoriesForUser: (userId: string) =>
    prisma.categoryNode.findMany({
      where: { userId, isActive: true, depth: { gt: 0 } },
      select: {
        id: true,
        label: true,
        sectionId: true,
        type: true,
        depth: true,
        parentCategoryId: true,
        plannedAmount: true,
        budgetType: true,
        color: true,
        icon: true,
      },
      orderBy: [{ sectionId: 'asc' }, { depth: 'asc' }],
    }),

  findCategoryById: (id: string, userId: string) =>
    prisma.categoryNode.findFirst({ where: { id, userId } }),

  findOverrides: (userId: string, year: number, month: number) =>
    prisma.budgetOverride.findMany({ where: { userId, year, month } }),

  upsertOverride: (
    userId: string,
    year: number,
    month: number,
    categoryId: string,
    planned: number,
  ) =>
    prisma.budgetOverride.upsert({
      where: { userId_year_month_categoryId: { userId, year, month, categoryId } },
      create: { userId, year, month, categoryId, planned },
      update: { planned },
    }),
};
