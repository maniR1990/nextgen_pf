/**
 * Seeds Grocery sub-categories + July 2026 budget plan for mani.r16@gmail.com.
 * Run with: npx tsx scripts/seed-grocery-mani.ts
 */

import { loadEnvFiles } from './loadEnv';
loadEnvFiles();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'mani.r16@gmail.com';

const GROCERY_ITEMS: { name: string; planned: number }[] = [
  { name: 'Meat', planned: 3000 },
  { name: 'Rice', planned: 2500 },
  { name: 'Oil | Milk', planned: 2500 },
  { name: 'Vegies', planned: 2000 },
  { name: 'Fruits', planned: 2000 },
  { name: 'Dals', planned: 1500 },
  { name: 'Snacks', planned: 500 },
  { name: 'Spices | Masala | Flavors | Essence | Salt | Pickle', planned: 1000 },
  { name: 'Ghee | Nuts', planned: 1200 },
  { name: 'Soap | Brush | Paste | Handwash', planned: 500 },
  { name: 'Detergent | Wash Soap | Utensil | Brush', planned: 500 },
  { name: 'Others', planned: 1000 },
  { name: 'Bathroom Cleaner | Home Cleaner', planned: 300 },
  { name: 'Flowers | Temple | Others', planned: 500 },
];

const BUDGET_YEAR = 2026;
const BUDGET_MONTH = 7; // July

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  // 1. Find target user
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) throw new Error(`${TARGET_EMAIL} not found`);
  console.log(`✓ User: ${user.email} (${user.id})`);

  // 2. Find EXPENSE L0 system group
  const expenseGroup = await prisma.category.findFirst({
    where: { level: 0, type: 'EXPENSE', isSystem: true },
  });
  if (!expenseGroup) throw new Error('No EXPENSE system group found');
  console.log(`✓ EXPENSE group: ${expenseGroup.id}`);

  // 3. Find or create Grocery L1 under EXPENSE for this user
  const grocerySlug = `${user.id}-grocery`;
  const groceryPath = 'expense/grocery';

  const grocery = await prisma.category.upsert({
    where: { userId_slug: { userId: user.id, slug: grocerySlug } },
    update: { name: 'Grocery' },
    create: {
      userId: user.id,
      name: 'Grocery',
      slug: grocerySlug,
      parentId: expenseGroup.id,
      level: 1,
      path: groceryPath,
      type: 'EXPENSE',
      order: 10,
      isSystem: false,
      isActive: true,
      icon: '🛒',
      color: '#22c55e',
    },
  });
  console.log(`✓ Grocery L1: ${grocery.id}`);

  // 4. Upsert each sub-category + budget record
  for (const [i, item] of GROCERY_ITEMS.entries()) {
    const slug = `${user.id}-${toSlug(item.name)}`;
    const path = `${groceryPath}/${toSlug(item.name)}`;

    const cat = await prisma.category.upsert({
      where: { userId_slug: { userId: user.id, slug } },
      update: { name: item.name, monthlyBudget: item.planned },
      create: {
        userId: user.id,
        name: item.name,
        slug,
        parentId: grocery.id,
        level: 2,
        path,
        type: 'EXPENSE',
        order: i + 1,
        monthlyBudget: item.planned,
        isSystem: false,
        isActive: true,
      },
    });

    await prisma.budget.upsert({
      where: {
        userId_period_year_month_categoryId: {
          userId: user.id,
          period: 'MONTHLY',
          year: BUDGET_YEAR,
          month: BUDGET_MONTH,
          categoryId: cat.id,
        },
      },
      update: { plannedAmount: item.planned },
      create: {
        userId: user.id,
        period: 'MONTHLY',
        year: BUDGET_YEAR,
        month: BUDGET_MONTH,
        categoryId: cat.id,
        plannedAmount: item.planned,
        isRecurring: true,
      },
    });

    console.log(`  ✓ ${item.name.padEnd(55)} ₹${item.planned}`);
  }

  const total = GROCERY_ITEMS.reduce((s, i) => s + i.planned, 0);
  console.log(`\n✓ Done — ${GROCERY_ITEMS.length} sub-categories seeded`);
  console.log(
    `  Total planned: ₹${total.toLocaleString('en-IN')} for ${BUDGET_MONTH}/${BUDGET_YEAR}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
