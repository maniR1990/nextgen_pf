import { loadEnvFiles } from './loadEnv';
loadEnvFiles();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'mani.r16@gmail.com';

const HOUSEHOLD_ITEMS: { name: string; planned: number }[] = [
  { name: 'EB (Electricity)', planned: 5000 },
  { name: 'Gas', planned: 920 },
  { name: 'Internet', planned: 1000 },
  { name: 'Outside Food', planned: 1000 },
  { name: 'House Maintenance', planned: 3000 },
];

const BUDGET_YEAR = 2026;
const BUDGET_MONTH = 7;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) throw new Error(`${TARGET_EMAIL} not found`);
  console.log(`✓ User: ${user.email} (${user.id})`);

  const expenseGroup = await prisma.category.findFirst({
    where: { level: 0, type: 'EXPENSE', isSystem: true },
  });
  if (!expenseGroup) throw new Error('No EXPENSE system group found');
  console.log(`✓ EXPENSE group: ${expenseGroup.id}`);

  // Upsert Household L1
  const hhSlug = `${user.id}-household`;
  const hhPath = 'expense/household';

  const household = await prisma.category.upsert({
    where: { userId_slug: { userId: user.id, slug: hhSlug } },
    update: { name: 'Household' },
    create: {
      userId: user.id,
      name: 'Household',
      slug: hhSlug,
      parentId: expenseGroup.id,
      level: 1,
      path: hhPath,
      type: 'EXPENSE',
      order: 11,
      isSystem: false,
      isActive: true,
      icon: '🏠',
      color: '#f59e0b',
    },
  });
  console.log(`✓ Household L1: ${household.id}`);

  for (const [i, item] of HOUSEHOLD_ITEMS.entries()) {
    const slug = `${user.id}-hh-${toSlug(item.name)}`;
    const path = `${hhPath}/${toSlug(item.name)}`;

    const cat = await prisma.category.upsert({
      where: { userId_slug: { userId: user.id, slug } },
      update: { name: item.name, monthlyBudget: item.planned },
      create: {
        userId: user.id,
        name: item.name,
        slug,
        parentId: household.id,
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

    console.log(`  ✓ ${item.name.padEnd(25)} ₹${item.planned}`);
  }

  const total = HOUSEHOLD_ITEMS.reduce((s, i) => s + i.planned, 0);
  console.log(`\n✓ Done — ${HOUSEHOLD_ITEMS.length} sub-categories seeded`);
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
