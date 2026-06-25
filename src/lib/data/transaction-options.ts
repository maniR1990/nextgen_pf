import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { AccountsRepository } from '@/modules/accounts/accounts.repository';
import { CategoriesRepository } from '@/modules/categories/categories.repository';
import type { CategoryTreeNode } from '@/modules/categories/categories.types';
import { buildCategoryTree } from '@/modules/categories/lib/category-tree';
import { mapCategoryTreeToPickerOptions } from '@/modules/categories/lib/map-category-tree-to-picker-options';
import { flattenAccountsForPicker } from '@/modules/accounts/lib/flatten-accounts-for-picker';
import type { AccountGroupWithAccounts } from '@/modules/accounts/accounts.types';

export interface FormSourceOption {
  id: string;
  name: string;
  type: string;
  currentBalance: number;
  bank?: string | null;
}

export interface FormCategoryOption {
  id: string;
  label: string;
  parentLabel?: string;
  depth: number;
  type: string;
  icon?: string;
  color?: string;
  plannedAmount?: number | null;
}

export interface FormSinkingFundOption {
  id: string;
  label: string;
  target: number;
  saved: number;
  monthly: number;
}

type CategoryRow = Awaited<ReturnType<typeof CategoriesRepository.findAccessible>>[number];

function toTreeNode(row: CategoryRow): Omit<CategoryTreeNode, 'children'> {
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
    matchRules: (row.matchRules ?? []).map((r) => ({
      field: r.field,
      operator: r.operator,
      value: r.value as string | number | [number, number],
      priority: r.priority,
    })),
    color: row.color,
    icon: row.icon,
    order: row.order,
    isSystem: row.isSystem,
    isActive: row.isActive,
    monthlySpend: 0,
    budget: row.monthlyBudget,
    archivedAt: row.archivedAt,
  };
}

export async function getPaymentSourceOptions(userId: string): Promise<FormSourceOption[]> {
  const [groups, accounts] = await Promise.all([
    AccountsRepository.findGroupsByUserId(userId),
    AccountsRepository.findMany(userId, { skip: 0, take: 100, sort: 'name_asc' }),
  ]);

  const grouped: AccountGroupWithAccounts[] = groups.map((group) => ({
    id: group.id,
    name: group.name,
    type: group.type,
    slug: group.slug,
    order: group.order,
    icon: group.icon,
    color: group.color,
    isDefault: group.isDefault,
    isCollapsed: group.isCollapsed,
    accounts: accounts
      .filter((a) => a.groupId === group.id)
      .map((a) => ({
        id: a.id,
        name: a.name,
        code: a.code,
        type: a.type,
        subtype: a.subtype,
        balance: a.balance,
        currency: a.currency,
        status: a.status,
        isPrimary: a.isPrimary,
        isExcludeNetWorth: a.isExcludeNetWorth,
        isHidden: a.isHidden,
        institutionId: a.institutionId,
        groupId: a.groupId,
        archivedAt: a.archivedAt,
      })),
  }));

  return flattenAccountsForPicker(grouped);
}

export async function getCategoryOptions(userId: string): Promise<FormCategoryOption[]> {
  const rows = await CategoriesRepository.findAccessible(userId, {});
  const tree = buildCategoryTree(rows.map(toTreeNode));
  return mapCategoryTreeToPickerOptions(tree);
}

export async function getSinkingFundOptions(userId: string): Promise<FormSinkingFundOption[]> {
  const rows = await prisma.fund.findMany({
    where: { userId },
    select: { id: true, name: true, targetAmount: true, archivedAt: true },
    orderBy: { name: 'asc' },
  });
  return rows
    .filter((r) => r.archivedAt == null)
    .map((r) => ({
      id: r.id,
      label: r.name,
      target: r.targetAmount,
      saved: 0,
      monthly: 0,
    }));
}
