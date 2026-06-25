import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

export const MerchantAliasesRepository = {
  findByUserId: async (userId: string) => {
    // Prisma v5+ MongoDB doesn't reliably cast @db.ObjectId fields inside OR clauses.
    // Split into two queries and merge.
    const [userAliases, systemAliases] = await Promise.all([
      prisma.merchantAlias.findMany({
        where: { userId },
        orderBy: [{ source: 'asc' }, { confidence: 'desc' }],
      }),
      prisma.merchantAlias.findMany({
        where: { userId: null },
        orderBy: [{ source: 'asc' }, { confidence: 'desc' }],
      }),
    ]);
    return [...userAliases, ...systemAliases].sort(
      (a, b) => a.source.localeCompare(b.source) || b.confidence - a.confidence,
    );
  },

  create: (data: Prisma.MerchantAliasCreateInput) => prisma.merchantAlias.create({ data }),
};
