import type { CategoryFlowType, PrismaClient } from '@prisma/client';

type SeedNode = {
  key: string;
  name: string;
  slug: string;
  level: 0 | 1 | 2;
  type: CategoryFlowType;
  icon?: string;
  order: number;
  parentKey?: string;
  children?: SeedNode[];
};

const SYSTEM_CATEGORY_TREE: SeedNode[] = [
  {
    key: 'income',
    name: 'Income',
    slug: 'income',
    level: 0,
    type: 'INCOME',
    icon: '💰',
    order: 0,
    children: [
      {
        key: 'active-income',
        name: 'Active Income',
        slug: 'active-income',
        level: 1,
        type: 'INCOME',
        icon: '🏢',
        order: 0,
        parentKey: 'income',
        children: [
          {
            key: 'salary',
            name: 'Salary',
            slug: 'salary',
            level: 2,
            type: 'INCOME',
            icon: '🏛️',
            order: 0,
            parentKey: 'active-income',
          },
          {
            key: 'freelance',
            name: 'Freelance / Contract',
            slug: 'freelance',
            level: 2,
            type: 'INCOME',
            icon: '💼',
            order: 1,
            parentKey: 'active-income',
          },
        ],
      },
    ],
  },
  {
    key: 'expense',
    name: 'Expenses',
    slug: 'expenses',
    level: 0,
    type: 'EXPENSE',
    icon: '💸',
    order: 1,
    children: [
      {
        key: 'housing',
        name: 'Housing',
        slug: 'housing',
        level: 1,
        type: 'EXPENSE',
        icon: '🏠',
        order: 0,
        parentKey: 'expense',
        children: [
          {
            key: 'rent',
            name: 'Rent / EMI',
            slug: 'rent',
            level: 2,
            type: 'EXPENSE',
            icon: '🔑',
            order: 0,
            parentKey: 'housing',
          },
          {
            key: 'utilities',
            name: 'Electricity',
            slug: 'utilities',
            level: 2,
            type: 'EXPENSE',
            icon: '💡',
            order: 1,
            parentKey: 'housing',
          },
        ],
      },
      {
        key: 'transport',
        name: 'Transport',
        slug: 'transport',
        level: 1,
        type: 'EXPENSE',
        icon: '🚗',
        order: 1,
        parentKey: 'expense',
        children: [
          {
            key: 'fuel',
            name: 'Fuel',
            slug: 'fuel',
            level: 2,
            type: 'EXPENSE',
            icon: '⛽',
            order: 0,
            parentKey: 'transport',
          },
        ],
      },
    ],
  },
  {
    key: 'investment',
    name: 'Investments',
    slug: 'investments',
    level: 0,
    type: 'INVESTMENT',
    icon: '📈',
    order: 2,
    children: [
      {
        key: 'equity',
        name: 'Equity',
        slug: 'equity',
        level: 1,
        type: 'INVESTMENT',
        icon: '📊',
        order: 0,
        parentKey: 'investment',
        children: [
          {
            key: 'mutual-funds',
            name: 'Mutual Funds',
            slug: 'mutual-funds',
            level: 2,
            type: 'INVESTMENT',
            icon: '📦',
            order: 0,
            parentKey: 'equity',
          },
        ],
      },
    ],
  },
];

function buildPath(type: CategoryFlowType, slug: string, parentPath?: string | null) {
  if (parentPath) return `${parentPath}/${slug}`;
  return `${type.toLowerCase()}/${slug}`;
}

async function upsertNode(
  prisma: PrismaClient,
  node: SeedNode,
  parentPath: string | null,
  idByKey: Map<string, string>,
) {
  const path = buildPath(node.type, node.slug, parentPath);
  const parentId = node.parentKey ? idByKey.get(node.parentKey) ?? null : null;

  const existing = await prisma.category.findFirst({
    where: { userId: null, isSystem: true, slug: node.slug },
    select: { id: true },
  });

  const record = existing
    ? await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: node.name,
          path,
          level: node.level,
          type: node.type,
          icon: node.icon,
          order: node.order,
          parentId,
          isSystem: true,
          isActive: true,
        },
      })
    : await prisma.category.create({
        data: {
          userId: null,
          name: node.name,
          slug: node.slug,
          path,
          level: node.level,
          type: node.type,
          icon: node.icon,
          order: node.order,
          parentId,
          isSystem: true,
          isActive: true,
          matchRules: [],
        },
      });

  idByKey.set(node.key, record.id);

  for (const child of node.children ?? []) {
    await upsertNode(prisma, child, path, idByKey);
  }
}

export async function seedSystemCategories(prisma: PrismaClient) {
  const idByKey = new Map<string, string>();

  for (const root of SYSTEM_CATEGORY_TREE) {
    await upsertNode(prisma, root, null, idByKey);
  }

  const count = await prisma.category.count({ where: { isSystem: true } });
  console.log(`→ Seeded ${count} system categories`);
}
