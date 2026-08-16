import {
  ConflictError,
  NotFoundError,
  ProjectActivityItemNotFoundError,
  ProjectForecastLineNotFoundError,
  ProjectNotFoundError,
  ProjectVendorHasTransactionsError,
  ProjectVendorMismatchError,
  ProjectVendorNotFoundError,
  ValidationError,
} from '@/lib/api/errors';
import { buildMeta } from '@/lib/api/pagination';
import type { Prisma } from '@prisma/client';
import { ProjectsRepository } from './projects.repository';
import type {
  CreateActivityItemDto,
  CreateForecastLineDto,
  CreateProjectDto,
  CreateVendorDto,
  ForecastLineSummary,
  ListProjectsQuery,
  ProjectListSummary,
  ProjectSummary,
  ReferenceSummary,
  UpdateActivityItemDto,
  UpdateForecastLineDto,
  UpdateProjectDto,
  UpdateVendorDto,
  VendorSummary,
} from './projects.types';

function assertOwned(project: { userId: string }, userId: string) {
  if (project.userId !== userId) throw new ProjectNotFoundError();
}

function isString(value: string | null): value is string {
  return value !== null;
}

async function resolveFundingLabel(
  userId: string,
  fundingAccountId: string | null,
  fundingFundId: string | null,
): Promise<string | null> {
  if (fundingAccountId) {
    const account = await ProjectsRepository.findAccountById(userId, fundingAccountId);
    return account?.name ?? null;
  }
  if (fundingFundId) {
    const fund = await ProjectsRepository.findFundById(userId, fundingFundId);
    return fund?.name ?? null;
  }
  return null;
}

async function resolveForecastLines(
  projectId: string,
  lines: Awaited<ReturnType<typeof ProjectsRepository.findById>>['forecastLines'],
  vendors: Awaited<ReturnType<typeof ProjectsRepository.findById>>['vendors'],
): Promise<ForecastLineSummary[]> {
  const lineIds = lines.map((l) => l.id);
  const actualRows = await ProjectsRepository.sumActualByForecastLine(projectId, lineIds);
  const actualMap = new Map(actualRows.map((r) => [r.projectForecastLineId, r._sum.amount ?? 0]));
  const vendorNameMap = new Map(vendors.map((v) => [v.id, v.name]));
  return lines.map((line) => ({
    ...line,
    actualAmount: actualMap.get(line.id) ?? 0,
    vendorLabel: line.vendorId ? (vendorNameMap.get(line.vendorId) ?? null) : null,
  }));
}

async function resolveVendors(
  projectId: string,
  vendors: Awaited<ReturnType<typeof ProjectsRepository.findById>>['vendors'],
): Promise<VendorSummary[]> {
  const vendorIds = vendors.map((v) => v.id);
  const paymentRows = await ProjectsRepository.sumPaymentsByVendor(projectId, vendorIds);
  const paidMap = new Map(paymentRows.map((r) => [r.projectVendorId, r._sum.amount ?? 0]));
  return vendors.map((vendor) => ({
    ...vendor,
    balance: vendor.contractAmount - (paidMap.get(vendor.id) ?? 0),
  }));
}

function resolveReferences(
  references: Awaited<ReturnType<typeof ProjectsRepository.findById>>['references'],
  vendors: Awaited<ReturnType<typeof ProjectsRepository.findById>>['vendors'],
): ReferenceSummary[] {
  const vendorNameMap = new Map(vendors.map((v) => [v.id, v.name]));
  return references.map((ref) => ({
    ...ref,
    vendorLabel: ref.vendorId ? (vendorNameMap.get(ref.vendorId) ?? null) : null,
  }));
}

async function toSummary(
  userId: string,
  project: Awaited<ReturnType<typeof ProjectsRepository.findById>>,
): Promise<ProjectSummary> {
  const [fundingLabel, forecastLines, totalRow, vendors, plannedRows] = await Promise.all([
    resolveFundingLabel(userId, project.fundingAccountId, project.fundingFundId),
    resolveForecastLines(project.id, project.forecastLines, project.vendors),
    ProjectsRepository.sumTotalByProject(project.id),
    resolveVendors(project.id, project.vendors),
    ProjectsRepository.sumByPlannedFlag(project.id),
  ]);
  const forecastTotal = forecastLines.reduce((sum, l) => sum + l.forecastAmount, 0);
  const spentTotal = totalRow._sum.amount ?? 0;
  const references = resolveReferences(project.references, project.vendors);
  const plannedTotal = plannedRows.find((r) => r.isPlanned)?._sum.amount ?? 0;
  const unplannedTotal = plannedRows.find((r) => !r.isPlanned)?._sum.amount ?? 0;
  return {
    ...project,
    fundingLabel,
    forecastLines,
    forecastTotal,
    spentTotal,
    vendors,
    todos: project.todos,
    activityNotes: project.activityNotes,
    references,
    plannedTotal,
    unplannedTotal,
  };
}

// Lightweight counterpart to toSummary() for the list page — that function's
// forecast/vendor/spend aggregation requires the full document (embedded
// forecastLines/vendors) plus 4 extra queries per project; the list only ever
// renders name/status/description/dates/funding, so this skips all of it and
// only resolves the one thing ProjectCard actually shows ("Funded from X").
//
// Funding labels come from name maps built once for the whole page (see
// ProjectsService.list) rather than a per-project lookup — resolveFundingLabel
// does a findFirst per call, which turned a 20-100 row page into 20-100 extra
// round trips; batching collapses that to 2 queries total for the page.
function toListSummary(
  project: Awaited<ReturnType<typeof ProjectsRepository.findMany>>[number],
  accountNameById: Map<string, string>,
  fundNameById: Map<string, string>,
): ProjectListSummary {
  const fundingLabel = project.fundingAccountId
    ? (accountNameById.get(project.fundingAccountId) ?? null)
    : project.fundingFundId
      ? (fundNameById.get(project.fundingFundId) ?? null)
      : null;
  return { ...project, fundingLabel };
}

async function assertFundingTargetsExist(
  userId: string,
  dto: { fundingAccountId?: string; fundingFundId?: string },
) {
  if (dto.fundingAccountId) {
    const account = await ProjectsRepository.findAccountById(userId, dto.fundingAccountId);
    if (!account) throw new NotFoundError('Funding account not found');
  }
  if (dto.fundingFundId) {
    const fund = await ProjectsRepository.findFundById(userId, dto.fundingFundId);
    if (!fund) throw new NotFoundError('Funding fund not found');
  }
}

async function loadOwnedProject(id: string, userId: string) {
  const project = await ProjectsRepository.findById(id);
  assertOwned(project, userId);
  return project;
}

export const ProjectsService = {
  async list(userId: string, query: ListProjectsQuery) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      ProjectsRepository.findMany(userId, {
        skip,
        take: limit,
        sort: query.sort ?? 'created_desc',
        status: query.status,
      }),
      ProjectsRepository.countMany(userId, { status: query.status }),
    ]);

    const accountIds = [...new Set(projects.map((p) => p.fundingAccountId).filter(isString))];
    const fundIds = [...new Set(projects.map((p) => p.fundingFundId).filter(isString))];
    const [accounts, funds] = await Promise.all([
      ProjectsRepository.findAccountsByIds(userId, accountIds),
      ProjectsRepository.findFundsByIds(userId, fundIds),
    ]);
    const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));
    const fundNameById = new Map(funds.map((f) => [f.id, f.name]));

    const data = projects.map((p) => toListSummary(p, accountNameById, fundNameById));
    return { data, meta: buildMeta(page, limit, total) };
  },

  async create(userId: string, dto: CreateProjectDto): Promise<ProjectSummary> {
    await assertFundingTargetsExist(userId, dto);

    const forecastLines = (dto.forecastLines ?? []).map((line) => ({
      id: crypto.randomUUID(),
      description: line.description,
      forecastAmount: line.forecastAmount,
      createdAt: new Date(),
    }));

    const created = await ProjectsRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      description: dto.description,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      targetCompletionDate: dto.targetCompletionDate
        ? new Date(dto.targetCompletionDate)
        : undefined,
      notes: dto.notes,
      forecastLines,
      ...(dto.fundingAccountId && { fundingAccount: { connect: { id: dto.fundingAccountId } } }),
      ...(dto.fundingFundId && { fundingFund: { connect: { id: dto.fundingFundId } } }),
    });

    return toSummary(userId, created);
  },

  async get(id: string, userId: string): Promise<ProjectSummary> {
    const project = await loadOwnedProject(id, userId);
    return toSummary(userId, project);
  },

  async update(id: string, userId: string, dto: UpdateProjectDto): Promise<ProjectSummary> {
    await loadOwnedProject(id, userId);
    await assertFundingTargetsExist(userId, dto);

    const data: Prisma.ProjectUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
      ...(dto.targetCompletionDate !== undefined && {
        targetCompletionDate: new Date(dto.targetCompletionDate),
      }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.status !== undefined && { status: dto.status }),
    };

    // Exactly one funding source at a time — setting one clears the other.
    if (dto.fundingAccountId !== undefined) {
      data.fundingAccount = { connect: { id: dto.fundingAccountId } };
      data.fundingFund = { disconnect: true };
    }
    if (dto.fundingFundId !== undefined) {
      data.fundingFund = { connect: { id: dto.fundingFundId } };
      data.fundingAccount = { disconnect: true };
    }

    const updated = await ProjectsRepository.update(id, data);
    return toSummary(userId, updated);
  },

  async hardDelete(id: string, userId: string): Promise<void> {
    await loadOwnedProject(id, userId);
    // No linked-transaction guard yet — FinanceTransaction only gains `projectId` in
    // Slice 3. Once it exists, this must block or un-tag linked transactions before
    // deleting, per the plan doc's "un-tag, never orphan ledger history" decision.
    await ProjectsRepository.hardDelete(id);
  },

  async addForecastLine(
    projectId: string,
    userId: string,
    dto: CreateForecastLineDto,
  ): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);

    if (dto.vendorId && !project.vendors.some((v) => v.id === dto.vendorId)) {
      throw new ProjectVendorMismatchError();
    }

    const newLine = {
      id: crypto.randomUUID(),
      description: dto.description,
      forecastAmount: dto.forecastAmount,
      vendorId: dto.vendorId ?? null,
      createdAt: new Date(),
    };

    const updated = await ProjectsRepository.update(projectId, {
      forecastLines: [...project.forecastLines, newLine],
    });

    return toSummary(userId, updated);
  },

  async updateForecastLine(
    projectId: string,
    lineId: string,
    userId: string,
    dto: UpdateForecastLineDto,
  ): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);

    const existingLine = project.forecastLines.find((l) => l.id === lineId);
    if (!existingLine) throw new ProjectForecastLineNotFoundError();

    if (dto.vendorId && !project.vendors.some((v) => v.id === dto.vendorId)) {
      throw new ProjectVendorMismatchError();
    }

    const forecastLines = project.forecastLines.map((line) =>
      line.id === lineId
        ? {
            ...line,
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.forecastAmount !== undefined && { forecastAmount: dto.forecastAmount }),
            ...(dto.vendorId !== undefined && { vendorId: dto.vendorId || null }),
          }
        : line,
    );

    const updated = await ProjectsRepository.update(projectId, { forecastLines });
    return toSummary(userId, updated);
  },

  async removeForecastLine(
    projectId: string,
    lineId: string,
    userId: string,
  ): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);

    if (!project.forecastLines.some((l) => l.id === lineId)) {
      throw new ProjectForecastLineNotFoundError();
    }

    const forecastLines = project.forecastLines.filter((l) => l.id !== lineId);
    const updated = await ProjectsRepository.update(projectId, { forecastLines });
    return toSummary(userId, updated);
  },

  async addVendor(
    projectId: string,
    userId: string,
    dto: CreateVendorDto,
  ): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);

    const newVendor = {
      id: crypto.randomUUID(),
      name: dto.name,
      contractAmount: dto.contractAmount,
      notes: dto.notes ?? null,
      createdAt: new Date(),
    };

    const updated = await ProjectsRepository.update(projectId, {
      vendors: [...project.vendors, newVendor],
    });
    return toSummary(userId, updated);
  },

  async updateVendor(
    projectId: string,
    vendorId: string,
    userId: string,
    dto: UpdateVendorDto,
  ): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);

    if (!project.vendors.some((v) => v.id === vendorId)) {
      throw new ProjectVendorNotFoundError();
    }

    const vendors = project.vendors.map((vendor) =>
      vendor.id === vendorId
        ? {
            ...vendor,
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.contractAmount !== undefined && { contractAmount: dto.contractAmount }),
            ...(dto.notes !== undefined && { notes: dto.notes }),
          }
        : vendor,
    );

    const updated = await ProjectsRepository.update(projectId, { vendors });
    return toSummary(userId, updated);
  },

  async removeVendor(projectId: string, vendorId: string, userId: string): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);

    if (!project.vendors.some((v) => v.id === vendorId)) {
      throw new ProjectVendorNotFoundError();
    }

    const linkedCount = await ProjectsRepository.countTransactionsByVendor(projectId, vendorId);
    if (linkedCount > 0) throw new ProjectVendorHasTransactionsError();

    const vendors = project.vendors.filter((v) => v.id !== vendorId);
    // Un-link, don't orphan — any forecast line pointing at this vendor would
    // otherwise carry a dangling vendorId once the vendor itself is gone.
    const forecastLines = project.forecastLines.map((line) =>
      line.vendorId === vendorId ? { ...line, vendorId: null } : line,
    );
    const updated = await ProjectsRepository.update(projectId, { vendors, forecastLines });
    return toSummary(userId, updated);
  },

  // ── Activity — non-financial: a checklist, a tagged timeline, and reference
  // details. Three separate embedded arrays, one item id space checked across
  // all three for update/remove — see the Prisma schema comment for why they're
  // not one polymorphic type.

  async addActivityItem(
    projectId: string,
    userId: string,
    dto: CreateActivityItemDto,
  ): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);
    const id = crypto.randomUUID();
    const createdAt = new Date();

    if (dto.kind === 'todo') {
      const todos = [...project.todos, { id, text: dto.text ?? '', done: false, createdAt }];
      const updated = await ProjectsRepository.update(projectId, { todos });
      return toSummary(userId, updated);
    }

    if (dto.kind === 'note') {
      const activityNotes = [
        ...project.activityNotes,
        {
          id,
          text: dto.text ?? '',
          tag: dto.tag as never,
          date: dto.date ? new Date(dto.date) : createdAt,
          returnOfTransactionId: dto.returnOfTransactionId ?? null,
          createdAt,
        },
      ];
      const updated = await ProjectsRepository.update(projectId, { activityNotes });
      return toSummary(userId, updated);
    }

    // kind === 'reference'
    if (dto.vendorId && !project.vendors.some((v) => v.id === dto.vendorId)) {
      throw new ValidationError('vendorId does not belong to this project');
    }
    const references = [
      ...project.references,
      { id, key: dto.key ?? '', value: dto.value ?? '', vendorId: dto.vendorId ?? null, createdAt },
    ];
    const updated = await ProjectsRepository.update(projectId, { references });
    return toSummary(userId, updated);
  },

  async updateActivityItem(
    projectId: string,
    itemId: string,
    userId: string,
    dto: UpdateActivityItemDto,
  ): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);

    if (project.todos.some((t) => t.id === itemId)) {
      const todos = project.todos.map((t) =>
        t.id === itemId
          ? {
              ...t,
              ...(dto.text !== undefined && { text: dto.text }),
              ...(dto.done !== undefined && { done: dto.done }),
            }
          : t,
      );
      const updated = await ProjectsRepository.update(projectId, { todos });
      return toSummary(userId, updated);
    }

    if (project.activityNotes.some((n) => n.id === itemId)) {
      const activityNotes = project.activityNotes.map((n) =>
        n.id === itemId ? { ...n, ...(dto.text !== undefined && { text: dto.text }) } : n,
      );
      const updated = await ProjectsRepository.update(projectId, { activityNotes });
      return toSummary(userId, updated);
    }

    if (project.references.some((r) => r.id === itemId)) {
      const references = project.references.map((r) =>
        r.id === itemId
          ? {
              ...r,
              ...(dto.key !== undefined && { key: dto.key }),
              ...(dto.value !== undefined && { value: dto.value }),
            }
          : r,
      );
      const updated = await ProjectsRepository.update(projectId, { references });
      return toSummary(userId, updated);
    }

    throw new ProjectActivityItemNotFoundError();
  },

  async removeActivityItem(
    projectId: string,
    itemId: string,
    userId: string,
  ): Promise<ProjectSummary> {
    const project = await loadOwnedProject(projectId, userId);

    if (project.todos.some((t) => t.id === itemId)) {
      const todos = project.todos.filter((t) => t.id !== itemId);
      const updated = await ProjectsRepository.update(projectId, { todos });
      return toSummary(userId, updated);
    }

    if (project.activityNotes.some((n) => n.id === itemId)) {
      const activityNotes = project.activityNotes.filter((n) => n.id !== itemId);
      const updated = await ProjectsRepository.update(projectId, { activityNotes });
      return toSummary(userId, updated);
    }

    if (project.references.some((r) => r.id === itemId)) {
      const references = project.references.filter((r) => r.id !== itemId);
      const updated = await ProjectsRepository.update(projectId, { references });
      return toSummary(userId, updated);
    }

    throw new ProjectActivityItemNotFoundError();
  },

  async close(id: string, userId: string): Promise<ProjectSummary> {
    const project = await loadOwnedProject(id, userId);
    if (project.status === 'COMPLETED') {
      throw new ConflictError('Project is already closed');
    }
    const updated = await ProjectsRepository.update(id, {
      status: 'COMPLETED',
      completedAt: new Date(),
    });
    return toSummary(userId, updated);
  },

  async reopen(id: string, userId: string): Promise<ProjectSummary> {
    const project = await loadOwnedProject(id, userId);
    if (project.status !== 'COMPLETED') {
      throw new ConflictError('Project is not closed');
    }
    const updated = await ProjectsRepository.update(id, {
      status: 'ACTIVE',
      completedAt: null,
    });
    return toSummary(userId, updated);
  },
};
