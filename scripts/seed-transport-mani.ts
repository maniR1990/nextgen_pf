import { loadEnvFiles } from './loadEnv';
loadEnvFiles();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TARGET_EMAIL = 'mani.r16@gmail.com';
const BUDGET_YEAR = 2026;
const BUDGET_MONTH = 7;

const TRANSPORT_ITEMS: { name: string; planned: number }[] = [
  { name: 'Fuel / Local Travel', planned: 3000 },
  { name: 'Other Fee', planned: 2500 },
];

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

  // Transport is a system L1 — find it
  const transport = await prisma.category.findFirst({
    where: { level: 1, isSystem: true, name: { contains: 'Transport', mode: 'insensitive' } },
  });
  if (!transport) throw new Error('Transport system category not found');
  console.log(`✓ Transport L1: ${transport.id}`);

  for (const [i, item] of TRANSPORT_ITEMS.entries()) {
    const slug = `${user.id}-tr-${toSlug(item.name)}`;
    const path = `expense/transport/${toSlug(item.name)}`;

    const cat = await prisma.category.upsert({
      where: { userId_slug: { userId: user.id, slug } },
      update: { name: item.name, monthlyBudget: item.planned },
      create: {
        userId: user.id,
        name: item.name,
        slug,
        parentId: transport.id,
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

  const total = TRANSPORT_ITEMS.reduce((s, i) => s + i.planned, 0);
  console.log(`\n✓ Done — ${TRANSPORT_ITEMS.length} sub-categories under Transport`);
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
