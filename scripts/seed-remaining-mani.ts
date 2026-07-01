/**
 * Seeds remaining budget categories for mani.r16@gmail.com — July 2026.
 *
 * Groups:
 *  - Insurance         (new L1)  : Term, Vehicle, Family Health, Parents Health
 *  - Transport         (existing): Car/Bike Maintenance, Renewal PUC/Emission
 *  - House Hold        (existing): Home Repairs, Appliance/Gadget Replacement
 *  - Celebrations & Gifts (new L1): Festivals/Birthdays/Anniversary, Other Gifts/Offerings
 *  - Savings & Goals   (new L1)  : Medical Emergency Buffer, Back to School, Vacation Fund, Parents Support
 */

import { loadEnvFiles } from './loadEnv';
loadEnvFiles();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'mani.r16@gmail.com';
const BUDGET_YEAR = 2026;
const BUDGET_MONTH = 7;

function toSlug(prefix: string, name: string) {
  return `${prefix}-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

async function upsertCategory(params: {
  userId: string;
  name: string;
  slug: string;
  parentId: string;
  path: string;
  order: number;
  planned?: number;
  icon?: string;
  color?: string;
  level: number;
}) {
  return prisma.category.upsert({
    where: { userId_slug: { userId: params.userId, slug: params.slug } },
    update: { name: params.name, monthlyBudget: params.planned ?? 0 },
    create: {
      userId: params.userId,
      name: params.name,
      slug: params.slug,
      parentId: params.parentId,
      level: params.level,
      path: params.path,
      type: 'EXPENSE',
      order: params.order,
      monthlyBudget: params.planned ?? 0,
      isSystem: false,
      isActive: true,
      icon: params.icon,
      color: params.color,
    },
  });
}

async function upsertBudget(userId: string, categoryId: string, planned: number) {
  return prisma.budget.upsert({
    where: {
      userId_period_year_month_categoryId: {
        userId,
        period: 'MONTHLY',
        year: BUDGET_YEAR,
        month: BUDGET_MONTH,
        categoryId,
      },
    },
    update: { plannedAmount: planned },
    create: {
      userId,
      period: 'MONTHLY',
      year: BUDGET_YEAR,
      month: BUDGET_MONTH,
      categoryId,
      plannedAmount: planned,
      isRecurring: true,
    },
  });
}

async function seedGroup(
  label: string,
  parentId: string,
  parentPath: string,
  items: { name: string; planned: number }[],
  userId: string,
  slugPrefix: string,
  level: 2,
) {
  console.log(`\n── ${label}`);
  let total = 0;
  for (const [i, item] of items.entries()) {
    const slug = toSlug(slugPrefix, item.name);
    const path = `${parentPath}/${slug.split('-').slice(1).join('-')}`;
    const cat = await upsertCategory({
      userId,
      name: item.name,
      slug,
      parentId,
      path,
      order: i + 1,
      planned: item.planned,
      level,
    });
    await upsertBudget(userId, cat.id, item.planned);
    console.log(`  ✓ ${item.name.padEnd(45)} ₹${item.planned}`);
    total += item.planned;
  }
  return total;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) throw new Error(`${TARGET_EMAIL} not found`);
  console.log(`✓ User: ${user.email} (${user.id})`);

  const expenseGroup = await prisma.category.findFirst({
    where: { level: 0, type: 'EXPENSE', isSystem: true },
  });
  if (!expenseGroup) throw new Error('EXPENSE group not found');

  // ── Existing L1s ─────────────────────────────────────────────────────────
  const transport = await prisma.category.findFirst({
    where: { level: 1, isSystem: true, name: { contains: 'Transport', mode: 'insensitive' } },
  });
  if (!transport) throw new Error('Transport L1 not found');

  const household = await prisma.category.findFirst({
    where: { level: 1, userId: user.id, name: { contains: 'House Hold', mode: 'insensitive' } },
  });
  if (!household) throw new Error('House Hold L1 not found');

  // ── New L1: Insurance ─────────────────────────────────────────────────────
  const insurance = await upsertCategory({
    userId: user.id,
    name: 'Insurance',
    slug: `${user.id}-insurance`,
    parentId: expenseGroup.id,
    path: 'expense/insurance',
    level: 1,
    order: 12,
    icon: '🛡️',
    color: '#3b82f6',
  });
  console.log(`✓ Insurance L1: ${insurance.id}`);

  // ── New L1: Celebrations & Gifts ─────────────────────────────────────────
  const celebrations = await upsertCategory({
    userId: user.id,
    name: 'Celebrations & Gifts',
    slug: `${user.id}-celebrations-gifts`,
    parentId: expenseGroup.id,
    path: 'expense/celebrations-gifts',
    level: 1,
    order: 13,
    icon: '🎉',
    color: '#ec4899',
  });
  console.log(`✓ Celebrations & Gifts L1: ${celebrations.id}`);

  // ── New L1: Savings & Goals ───────────────────────────────────────────────
  const savingsGoals = await upsertCategory({
    userId: user.id,
    name: 'Savings & Goals',
    slug: `${user.id}-savings-goals`,
    parentId: expenseGroup.id,
    path: 'expense/savings-goals',
    level: 1,
    order: 14,
    icon: '🎯',
    color: '#8b5cf6',
  });
  console.log(`✓ Savings & Goals L1: ${savingsGoals.id}`);

  let grand = 0;

  // ── Insurance items ───────────────────────────────────────────────────────
  grand += await seedGroup(
    'Insurance',
    insurance.id,
    'expense/insurance',
    [
      { name: 'Term Insurance', planned: 7313 },
      { name: 'Vehicle Insurance', planned: 500 },
      { name: 'Family Health Insurance', planned: 3100 },
      { name: 'Parents Health Insurance', planned: 6000 },
    ],
    user.id,
    `${user.id}-ins`,
    2,
  );

  // ── Transport additions ───────────────────────────────────────────────────
  grand += await seedGroup(
    'Transport (additions)',
    transport.id,
    'expense/transport',
    [
      { name: 'Car / Bike Maintenance', planned: 1500 },
      { name: 'Renewal / PUC / Emission', planned: 150 },
    ],
    user.id,
    `${user.id}-tr`,
    2,
  );

  // ── House Hold additions ──────────────────────────────────────────────────
  grand += await seedGroup(
    'House Hold (additions)',
    household.id,
    'expense/household',
    [
      { name: 'Home Repairs', planned: 5000 },
      { name: 'Appliance / Gadget Replacement', planned: 2000 },
    ],
    user.id,
    `${user.id}-hh`,
    2,
  );

  // ── Celebrations & Gifts items ────────────────────────────────────────────
  grand += await seedGroup(
    'Celebrations & Gifts',
    celebrations.id,
    'expense/celebrations-gifts',
    [
      { name: 'Festivals / Birthdays / Anniversary', planned: 3000 },
      { name: 'Other Gifts / Offerings', planned: 1000 },
    ],
    user.id,
    `${user.id}-cel`,
    2,
  );

  // ── Savings & Goals items ─────────────────────────────────────────────────
  grand += await seedGroup(
    'Savings & Goals',
    savingsGoals.id,
    'expense/savings-goals',
    [
      { name: 'Medical Emergency Buffer', planned: 2500 },
      { name: 'Back to School', planned: 1000 },
      { name: 'Vacation Fund', planned: 4000 },
      { name: 'Parents Support', planned: 2000 },
    ],
    user.id,
    `${user.id}-sav`,
    2,
  );

  console.log(
    `\n✓ All done — total planned: ₹${grand.toLocaleString('en-IN')} for ${BUDGET_MONTH}/${BUDGET_YEAR}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
