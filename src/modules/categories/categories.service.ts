import {
  CategoryDepthExceededError,
  CategoryHasTransactionsError,
  CategoryNotFoundError,
  ConflictError,
  ForbiddenError,
} from '@/lib/api/errors';
import { buildMeta } from '@/lib/api/pagination';
import {
  CATEGORY_MAX_LEVEL,
  CATEGORY_STATS_TREND_MONTHS,
  CATEGORY_TOP_TRANSACTIONS_LIMIT,
  toCategoryFlowType,
} from '@/constants/categories';
import { CategoriesRepository } from './categories.repository';
import type {
  CategoryStats,
  CategoryTreeNode,
  CreateCategoryDto,
  ListCategoriesQuery,
  ReorderCategoryItem,
  UpdateCategoryDto,
} from './categories.types';
import {
  buildCategoryTree,
  buildPath,
  collectDescendantIds,
  isDescendant,
  rollupMonthlySpend,
  slugify,
} from './lib/category-tree';

type CategoryRow = Awaited<ReturnType<typeof CategoriesRepository.findById>>;

function findNodeInTree(nodes: CategoryTreeNode[], id: string): CategoryTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeInTree(node.children, id);
    if (found) return found;
  }
  return null;
}

function assertAccessible(category: CategoryRow, userId: string) {
  if (category.userId && category.userId !== userId) throw new CategoryNotFoundError();
  if (!category.userId && !category.isSystem) throw new CategoryNotFoundError();
}

function assertMutable(category: CategoryRow) {
  if (category.isSystem) throw new ForbiddenError('System categories cannot be modified');
}

async function uniqueSlug(userId: string, base: string): Promise<string> {
  let slug = base;
  let n = 1;
  while (await CategoriesRepository.findByUserAndSlug(userId, slug)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function currentBudgetPeriod() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function toTreeNode(
  row: CategoryRow,
  monthlySpend: number,
): Omit<CategoryTreeNode, 'children'> {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    parentId: row.parentId,
    level: row.level,
    path: row.path,
    type: row.type,
    monthlyBudget: row.monthlyBudget,
    budgetRollover: row.budgetRollover,
    matchRules: row.matchRules?.map((r) => ({
      field: r.field,
      operator: r.operator,
      value: r.value as string | number | [number, number],
      priority: r.priority,
    })) ?? [],
    color: row.color,
    icon: row.icon,
    order: row.order,
    isSystem: row.isSystem,
    isActive: row.isActive,
    monthlySpend,
    budget: row.monthlyBudget,
    archivedAt: row.archivedAt,
    children: [],
  };
}

async function loadSpendMap(userId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) return new Map<string, number>();
  try {
    const { year, month } = currentBudgetPeriod();
    const rows = await CategoriesRepository.spendByCategoryIds(userId, categoryIds, year, month);
    return new Map(rows.map((r) => [r.categoryId!, r._sum.amount ?? 0]));
  } catch {
    // groupBy is not critical — categories still load without spend data
    return new Map<string, number>();
  }
}

async function rebuildSubtreePaths(
  flat: CategoryRow[],
  nodeId: string,
  newSlug?: string,
): Promise<Array<{ id: string; data: { slug: string; path: string } }>> {
  const node = flat.find((r) => r.id === nodeId);
  if (!node) return [];

  const slug = newSlug ?? node.slug;
  const path =
    node.parentId != null
      ? buildPath(node.type, slug, flat.find((r) => r.id === node.parentId)?.path)
      : buildPath(node.type, slug);

  const updates: Array<{ id: string; data: { slug: string; path: string } }> = [
    { id: nodeId, data: { slug, path } },
  ];

  const children = flat.filter((r) => r.parentId === nodeId);
  for (const child of children) {
    const childUpdates = await rebuildSubtreePaths(
      flat.map((r) => (r.id === nodeId ? { ...r, slug, path } : r)),
      child.id,
    );
    updates.push(...childUpdates);
  }

  return updates;
}

export const CategoriesService = {
  async list(userId: string, query: ListCategoriesQuery) {
    const prismaType = query.type ? toCategoryFlowType(query.type) : undefined;
    const [rows, total] = await Promise.all([
      CategoriesRepository.findAccessible(userId, {
        includeArchived: query.includeArchived,
        type: prismaType,
      }),
      CategoriesRepository.countAccessible(userId, {
        includeArchived: query.includeArchived,
        type: prismaType,
      }),
    ]);

    const spendMap = await loadSpendMap(
      userId,
      rows.filter((r) => r.userId === userId || !r.isSystem).map((r) => r.id),
    );

    const flatNodes = rows.map((row) =>
      toTreeNode(row, spendMap.get(row.id) ?? 0),
    );
    const tree = buildCategoryTree(flatNodes);
    rollupMonthlySpend(tree);

    const page = query.page ?? 1;
    const limit = query.limit ?? 500;

    return {
      data: tree,
      meta: { ...buildMeta(page, limit, total), totalNodes: total },
    };
  },

  async create(userId: string, dto: CreateCategoryDto) {
    let level = 0;
    let type = dto.type;
    let parentPath: string | null = null;

    if (dto.parentId) {
      const parent = await CategoriesRepository.findById(dto.parentId);
      if (parent.userId && parent.userId !== userId) throw new CategoryNotFoundError();
      level = parent.level + 1;
      if (level > CATEGORY_MAX_LEVEL) throw new CategoryDepthExceededError();
      type = parent.type;
      parentPath = parent.path;
    }

    if (!type) {
      throw new ConflictError('type is required when creating a top-level category group');
    }

    const slug = await uniqueSlug(userId, slugify(dto.name));
    const path = buildPath(type, slug, parentPath);

    const siblings = await CategoriesRepository.findAccessible(userId, {});
    const maxOrder = siblings
      .filter((s) => s.parentId === (dto.parentId ?? null))
      .reduce((max, s) => Math.max(max, s.order), -1);

    const created = await CategoriesRepository.create({
      user: { connect: { id: userId } },
      name: dto.name,
      slug,
      path,
      type,
      level,
      ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
      monthlyBudget: dto.monthlyBudget ?? 0,
      budgetRollover: dto.budgetRollover ?? false,
      matchRules: dto.matchRules?.map((r) => ({ ...r, priority: r.priority ?? 0 })) ?? [],
      color: dto.color,
      icon: dto.icon,
      order: dto.order ?? maxOrder + 1,
    });

    return toTreeNode(created, 0);
  },

  async update(id: string, userId: string, dto: UpdateCategoryDto) {
    const existing = await CategoriesRepository.findById(id);
    assertAccessible(existing, userId);
    if (!existing.userId) throw new ForbiddenError('System categories cannot be modified');

    const data: Parameters<typeof CategoriesRepository.update>[1] = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.monthlyBudget !== undefined && { monthlyBudget: dto.monthlyBudget }),
      ...(dto.budgetRollover !== undefined && { budgetRollover: dto.budgetRollover }),
      ...(dto.matchRules !== undefined && {
        matchRules: dto.matchRules.map((r) => ({ ...r, priority: r.priority ?? 0 })),
      }),
    };

    if (dto.name !== undefined && dto.name !== existing.name) {
      const slug = await uniqueSlug(userId, slugify(dto.name));
      data.slug = slug;

      const flat = await CategoriesRepository.findAccessible(userId, { includeArchived: true });
      const pathUpdates = await rebuildSubtreePaths(flat, id, slug);
      await CategoriesRepository.update(id, data);
      if (pathUpdates.length > 1) {
        await CategoriesRepository.reorder(
          pathUpdates.filter((u) => u.id !== id).map(({ id: cid, data: pathData }) => ({
            id: cid,
            data: pathData,
          })),
        );
      }
    } else if (Object.keys(data).length > 0) {
      await CategoriesRepository.update(id, data);
    }

    const updated = await CategoriesRepository.findById(id);
    const spendMap = await loadSpendMap(userId, [id]);
    return toTreeNode(updated, spendMap.get(id) ?? 0);
  },

  async reorder(userId: string, items: ReorderCategoryItem[]) {
    const flat = await CategoriesRepository.findAccessible(userId, { includeArchived: true });
    const userOwned = flat.filter((r) => r.userId === userId);

    const updates: Array<{ id: string; data: Parameters<typeof CategoriesRepository.update>[1] }> = [];

    for (const item of items) {
      const node = userOwned.find((r) => r.id === item.id);
      if (!node) throw new CategoryNotFoundError();
      assertMutable(node);

      if (item.parentId && isDescendant(userOwned, item.id, item.parentId)) {
        throw new ConflictError('Cannot reparent category under its own descendant');
      }

      let level = 0;
      let parentPath: string | null = null;
      let type = node.type;

      if (item.parentId) {
        const parent = flat.find((r) => r.id === item.parentId);
        if (!parent) throw new CategoryNotFoundError();
        level = parent.level + 1;
        if (level > CATEGORY_MAX_LEVEL) throw new CategoryDepthExceededError();
        parentPath = parent.path;
        type = parent.type;
      }

      const path = buildPath(type, node.slug, parentPath);
      updates.push({
        id: item.id,
        data: {
          order: item.order,
          level,
          type,
          path,
          ...(item.parentId
            ? { parent: { connect: { id: item.parentId } } }
            : { parent: { disconnect: true } }),
        },
      });
    }

    await CategoriesRepository.reorder(updates);

    // Recalculate paths for descendants of reparented nodes
    const refreshed = await CategoriesRepository.findAccessible(userId, { includeArchived: true });
    const pathFixes: Array<{ id: string; data: { path: string } }> = [];
    for (const item of items) {
      const descendants = [...collectDescendantIds(refreshed, item.id)].filter((id) => id !== item.id);
      for (const descId of descendants) {
        const desc = refreshed.find((r) => r.id === descId);
        const parent = refreshed.find((r) => r.id === desc?.parentId);
        if (desc) {
          pathFixes.push({
            id: descId,
            data: { path: buildPath(desc.type, desc.slug, parent?.path) },
          });
        }
      }
    }
    if (pathFixes.length > 0) await CategoriesRepository.reorder(pathFixes);

    return CategoriesService.list(userId, {});
  },

  async getById(id: string, userId: string): Promise<CategoryTreeNode> {
    const category = await CategoriesRepository.findById(id);
    assertAccessible(category, userId);

    const flat = await CategoriesRepository.findAccessible(userId, { includeArchived: true });
    if (!flat.some((row) => row.id === id)) throw new CategoryNotFoundError();

    const subtreeIds = collectDescendantIds(flat, id);
    let ancestorId = category.parentId;
    while (ancestorId) {
      subtreeIds.add(ancestorId);
      ancestorId = flat.find((row) => row.id === ancestorId)?.parentId ?? null;
    }
    const subset = flat.filter((row) => subtreeIds.has(row.id));
    const spendMap = await loadSpendMap(userId, [...subtreeIds]);

    const flatNodes = subset.map((row) => toTreeNode(row, spendMap.get(row.id) ?? 0));
    const tree = buildCategoryTree(flatNodes);
    rollupMonthlySpend(tree);

    const node = findNodeInTree(tree, id);
    if (!node) throw new CategoryNotFoundError();
    return node;
  },

  async delete(id: string, userId: string) {
    const category = await CategoriesRepository.findById(id);
    assertAccessible(category, userId);
    if (!category.userId) throw new ForbiddenError('System categories cannot be deleted');

    const txCount = await CategoriesRepository.countTransactions(id);
    if (txCount > 0) throw new CategoryHasTransactionsError(txCount);

    const flat = await CategoriesRepository.findAccessible(userId, { includeArchived: true });
    const descendants = collectDescendantIds(flat, id);
    for (const descId of descendants) {
      if (descId === id) continue;
      const childTx = await CategoriesRepository.countTransactions(descId);
      if (childTx > 0) throw new CategoryHasTransactionsError(childTx);
    }

    await CategoriesRepository.archiveMany([...descendants]);

    return { archived: true, id, archivedAt: new Date().toISOString() };
  },

  async getStats(id: string, userId: string): Promise<CategoryStats> {
    const category = await CategoriesRepository.findById(id);
    assertAccessible(category, userId);

    const { year, month } = currentBudgetPeriod();
    const [currentSpendRows, trendRows, topTx] = await Promise.all([
      CategoriesRepository.spendByCategoryIds(userId, [id], year, month),
      CategoriesRepository.spendTrend(userId, id, CATEGORY_STATS_TREND_MONTHS),
      CategoriesRepository.topTransactions(
        userId,
        id,
        year,
        month,
        CATEGORY_TOP_TRANSACTIONS_LIMIT,
      ),
    ]);

    const currentMonthSpend = currentSpendRows[0]?._sum.amount ?? 0;
    const trendMap = new Map<string, number>();
    for (const row of trendRows) {
      const key = `${row.budgetPeriodYear}-${row.budgetPeriodMonth}`;
      trendMap.set(key, (trendMap.get(key) ?? 0) + row.amount);
    }

    const monthlyTrend = [];
    for (let i = CATEGORY_STATS_TREND_MONTHS - 1; i >= 0; i -= 1) {
      const d = new Date(year, month - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const spend = trendMap.get(`${y}-${m}`) ?? 0;
      monthlyTrend.push({
        year: y,
        month: m,
        spend,
        budget: category.monthlyBudget,
        variance: category.monthlyBudget - spend,
      });
    }

    return {
      categoryId: id,
      name: category.name,
      path: category.path,
      monthlyBudget: category.monthlyBudget,
      currentMonthSpend,
      budgetVariance: category.monthlyBudget - currentMonthSpend,
      monthlyTrend,
      topTransactions: topTx,
    };
  },
};
