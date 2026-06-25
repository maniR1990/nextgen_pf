import type { InstitutionType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

const INSTITUTION_SELECT = {
  id: true,
  name: true,
  shortName: true,
  type: true,
  logoUrl: true,
  color: true,
  ifscPattern: true,
  isActive: true,
  isVerified: true,
  createdAt: true,
} satisfies Prisma.InstitutionSelect;

export const InstitutionsRepository = {
  findMany: (options: { type?: InstitutionType; search?: string; limit?: number }) =>
    prisma.institution.findMany({
      where: {
        isActive: true,
        ...(options.type && { type: options.type }),
        ...(options.search && {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { shortName: { contains: options.search, mode: 'insensitive' } },
          ],
        }),
      },
      select: INSTITUTION_SELECT,
      orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
      take: options.limit ?? 100,
    }),

  create: (data: Prisma.InstitutionCreateInput) =>
    prisma.institution.create({ data, select: INSTITUTION_SELECT }),
};
