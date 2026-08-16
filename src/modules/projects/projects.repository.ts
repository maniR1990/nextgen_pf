import type { ProjectSort } from '@/constants/projects';
import { prisma } from '@/lib/db/prisma';
import type { Prisma, ProjectStatus } from '@prisma/client';

const PROJECT_SELECT = {
  id: true,
  userId: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  targetCompletionDate: true,
  completedAt: true,
  notes: true,
  fundingAccountId: true,
  fundingFundId: true,
  forecastLines: true,
  vendors: true,
  todos: true,
  activityNotes: true,
  references: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProjectSelect;

// The list page (ProjectCard) only ever reads name/description/status/dates/
// funding — never the embedded forecastLines/vendors/todos/activityNotes/
// references arrays, which is also everything toSummary() fires extra
// aggregate queries against. Selecting only what the list actually renders
// avoids pulling those arrays over the wire for every project on every page
// load, and lets the service skip the per-project aggregate queries entirely
// for the list path — see toListSummary() in projects.service.ts.
const PROJECT_LIST_SELECT = {
  id: true,
  userId: true,
  name: true,
  description: true,
  status: true,
  startDate: true,
  targetCompletionDate: true,
  fundingAccountId: true,
  fundingFundId: true,
  createdAt: true,
} satisfies Prisma.ProjectSelect;

function sortOrderBy(sort: ProjectSort): Prisma.ProjectOrderByWithRelationInput {
  switch (sort) {
    case 'name_asc':
      return { name: 'asc' };
    case 'name_desc':
      return { name: 'desc' };
    case 'target_desc':
      return { targetCompletionDate: 'desc' };
    default:
      return { createdAt: 'desc' };
  }
}

export const ProjectsRepository = {
  findMany: (
    userId: string,
    options: { skip: number; take: number; sort: ProjectSort; status?: ProjectStatus },
  ) =>
    prisma.project.findMany({
      where: { userId, ...(options.status && { status: options.status }) },
      select: PROJECT_LIST_SELECT,
      orderBy: sortOrderBy(options.sort),
      skip: options.skip,
      take: options.take,
    }),

  countMany: (userId: string, options: { status?: ProjectStatus }) =>
    prisma.project.count({
      where: { userId, ...(options.status && { status: options.status }) },
    }),

  findById: (id: string) =>
    prisma.project.findUniqueOrThrow({ where: { id }, select: PROJECT_SELECT }),

  create: (data: Prisma.ProjectCreateInput) =>
    prisma.project.create({ data, select: PROJECT_SELECT }),

  update: (id: string, data: Prisma.ProjectUpdateInput) =>
    prisma.project.update({ where: { id }, data, select: PROJECT_SELECT }),

  hardDelete: (id: string) => prisma.project.delete({ where: { id } }),

  findAccountById: (userId: string, id: string) =>
    prisma.account.findFirst({ where: { id, userId }, select: { id: true, name: true } }),

  findFundById: (userId: string, id: string) =>
    prisma.fund.findFirst({ where: { id, userId }, select: { id: true, name: true } }),

  /** Batched counterpart to findAccountById — one query for every funding account
   *  a page of projects references, instead of one findFirst per project. */
  findAccountsByIds: (userId: string, ids: string[]) =>
    ids.length === 0
      ? Promise.resolve([])
      : prisma.account.findMany({
          where: { id: { in: ids }, userId },
          select: { id: true, name: true },
        }),

  /** Batched counterpart to findFundById — same reasoning as findAccountsByIds. */
  findFundsByIds: (userId: string, ids: string[]) =>
    ids.length === 0
      ? Promise.resolve([])
      : prisma.fund.findMany({
          where: { id: { in: ids }, userId },
          select: { id: true, name: true },
        }),

  /** Per forecast-line actual spend — matched transactions only. Excludes voided,
   *  same isSet: false reasoning as elsewhere in this codebase for absent fields. */
  sumActualByForecastLine: (projectId: string, lineIds: string[]) => {
    if (lineIds.length === 0) return Promise.resolve([]);
    return prisma.financeTransaction.groupBy({
      by: ['projectForecastLineId'],
      where: {
        projectId,
        projectForecastLineId: { in: lineIds },
        AND: [{ OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }] }],
      },
      _sum: { amount: true },
    });
  },

  /** Every non-voided transaction tagged to this project, matched to a forecast
   *  line or not — the project's true total spend, not just the sum of line actuals. */
  sumTotalByProject: (projectId: string) =>
    prisma.financeTransaction.aggregate({
      where: {
        projectId,
        AND: [{ OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }] }],
      },
      _sum: { amount: true },
    }),

  /** Per vendor balance input — sum of non-REFUND, non-voided transactions tagged
   *  with each vendor's id. See plan doc "cut #1": no netting relationship, just
   *  a plain sum excluded of refunds. */
  sumPaymentsByVendor: (projectId: string, vendorIds: string[]) => {
    if (vendorIds.length === 0) return Promise.resolve([]);
    return prisma.financeTransaction.groupBy({
      by: ['projectVendorId'],
      where: {
        projectId,
        projectVendorId: { in: vendorIds },
        NOT: { projectPaymentType: 'REFUND' },
        AND: [{ OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }] }],
      },
      _sum: { amount: true },
    });
  },

  countTransactionsByVendor: (projectId: string, vendorId: string) =>
    prisma.financeTransaction.count({ where: { projectId, projectVendorId: vendorId } }),

  /** Planned (matches a forecast line) vs unplanned split for the Reports view —
   *  reuses isPlanned, the same field the day-to-day budget already uses. */
  sumByPlannedFlag: (projectId: string) =>
    prisma.financeTransaction.groupBy({
      by: ['isPlanned'],
      where: {
        projectId,
        AND: [{ OR: [{ voidedAt: null }, { voidedAt: { isSet: false } }] }],
      },
      _sum: { amount: true },
    }),
};
