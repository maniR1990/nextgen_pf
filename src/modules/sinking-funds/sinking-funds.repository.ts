import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

const SELECT = {
  id: true,
  userId: true,
  name: true,
  purpose: true,
  targetAmount: true,
  color: true,
  icon: true,
  order: true,
  milestones: true,
  archivedAt: true,
} satisfies Prisma.FundSelect;

export const SinkingFundsRepository = {
  findByUserId: async (userId: string) => {
    const rows = await prisma.fund.findMany({
      where: { userId },
      select: SELECT,
      orderBy: { name: 'asc' },
    });
    // Prisma v5+ MongoDB: `{ field: null }` only matches explicitly-stored null, not absent fields.
    // Filter archivedAt in JS to handle both cases.
    return rows.filter((r) => r.archivedAt == null);
  },

  findById: (id: string) => prisma.fund.findUniqueOrThrow({ where: { id }, select: SELECT }),
};
