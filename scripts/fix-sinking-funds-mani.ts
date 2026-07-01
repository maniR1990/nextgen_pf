/**
 * Fixes the category type for sinking-fund items for mani.r16@gmail.com.
 *
 * BEFORE: Medical Emergency Buffer, Back to School, Vacation Fund → EXPENSE > Savings & Goals
 * AFTER:  Those 3 items → INVESTMENT > Sinking Funds (L1 → L2)
 *
 * Parents Support stays as EXPENSE — it's a real monthly cash outflow.
 * Savings & Goals L1 is archived after migration (Parents Support re-homed to House Hold).
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

async function main() {
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) throw new Error(`${TARGET_EMAIL} not found`);
  const uid = user.id;
  console.log(`✓ User: ${user.email}`);

  // ── 1. Find INVESTMENT L0 group ─────────────────────────────────────────
  const investGroup = await prisma.category.findFirst({
    where: { level: 0, type: 'INVESTMENT', isSystem: true },
  });
  if (!investGroup) throw new Error('INVESTMENT group not found');
  console.log(`✓ INVESTMENT group: ${investGroup.id}`);

  // ── 2. Upsert "Sinking Funds" L1 under INVESTMENT ──────────────────────
  const sfSlug = `${uid}-sinking-funds`;
  const sinkingFunds = await prisma.category.upsert({
    where: { userId_slug: { userId: uid, slug: sfSlug } },
    update: { name: 'Sinking Funds' },
    create: {
      userId: uid,
      name: 'Sinking Funds',
      slug: sfSlug,
      parentId: investGroup.id,
      level: 1,
      path: 'investment/sinking-funds',
      type: 'INVESTMENT',
      order: 10,
      isSystem: false,
      isActive: true,
      icon: '🪣',
      color: '#8b5cf6',
    },
  });
  console.log(`✓ Sinking Funds L1 (INVESTMENT): ${sinkingFunds.id}`);

  // ── 3. Sinking fund items to migrate ────────────────────────────────────
  const sfItems = [
    { name: 'Medical Emergency Buffer', planned: 2500 },
    { name: 'Back to School', planned: 1000 },
    { name: 'Vacation Fund', planned: 4000 },
  ];

  console.log('\n── Sinking Funds (INVESTMENT)');
  for (const [i, item] of sfItems.entries()) {
    const slug = toSlug(`${uid}-sf`, item.name);
    const path = `investment/sinking-funds/${slug.split('-').slice(2).join('-')}`;

    // Check if it already exists as EXPENSE — archive it
    const old = await prisma.category.findFirst({
      where: { userId: uid, name: item.name, type: 'EXPENSE' },
    });
    if (old) {
      // Remove its budget records for this period
      await prisma.budget.deleteMany({
        where: {
          userId: uid,
          categoryId: old.id,
          year: BUDGET_YEAR,
          month: BUDGET_MONTH,
        },
      });
      await prisma.category.update({
        where: { id: old.id },
        data: { isActive: false, archivedAt: new Date() },
      });
      console.log(`  ↳ Archived old EXPENSE entry: ${item.name}`);
    }

    // Create/update under INVESTMENT > Sinking Funds
    const cat = await prisma.category.upsert({
      where: { userId_slug: { userId: uid, slug } },
      update: {
        name: item.name,
        monthlyBudget: item.planned,
        type: 'INVESTMENT',
        parentId: sinkingFunds.id,
      },
      create: {
        userId: uid,
        name: item.name,
        slug,
        parentId: sinkingFunds.id,
        level: 2,
        path,
        type: 'INVESTMENT',
        order: i + 1,
        monthlyBudget: item.planned,
        isSystem: false,
        isActive: true,
      },
    });
    await upsertBudget(uid, cat.id, item.planned);
    console.log(`  ✓ ${item.name.padEnd(30)} ₹${item.planned}`);
  }

  // ── 4. Parents Support → stays EXPENSE, move to House Hold ─────────────
  console.log('\n── Parents Support → EXPENSE > House Hold');
  const household = await prisma.category.findFirst({
    where: { userId: uid, level: 1, name: { contains: 'House Hold', mode: 'insensitive' } },
  });
  if (!household) throw new Error('House Hold L1 not found');

  const psSlug = toSlug(`${uid}-hh`, 'parents-support');
  const oldPs = await prisma.category.findFirst({
    where: {
      userId: uid,
      name: { contains: 'Parents Support', mode: 'insensitive' },
      type: 'EXPENSE',
    },
  });

  if (oldPs && oldPs.parentId !== household.id) {
    // Re-parent to House Hold
    await prisma.category.update({
      where: { id: oldPs.id },
      data: { parentId: household.id, path: 'expense/household/parents-support', slug: psSlug },
    });
    console.log('  ✓ Parents Support re-homed to House Hold (₹2,000)');
  } else if (!oldPs) {
    const ps = await prisma.category.upsert({
      where: { userId_slug: { userId: uid, slug: psSlug } },
      update: { name: 'Parents Support', monthlyBudget: 2000 },
      create: {
        userId: uid,
        name: 'Parents Support',
        slug: psSlug,
        parentId: household.id,
        level: 2,
        path: 'expense/household/parents-support',
        type: 'EXPENSE',
        order: 10,
        monthlyBudget: 2000,
        isSystem: false,
        isActive: true,
      },
    });
    await upsertBudget(uid, ps.id, 2000);
    console.log('  ✓ Parents Support created under House Hold (₹2,000)');
  } else {
    console.log('  ✓ Parents Support already under House Hold (₹2,000)');
  }

  // ── 5. Archive the now-empty "Savings & Goals" EXPENSE L1 ───────────────
  const savingsGoalsL1 = await prisma.category.findFirst({
    where: { userId: uid, level: 1, name: 'Savings & Goals', type: 'EXPENSE' },
  });
  if (savingsGoalsL1) {
    const remaining = await prisma.category.count({
      where: { parentId: savingsGoalsL1.id, isActive: true },
    });
    if (remaining === 0) {
      await prisma.category.update({
        where: { id: savingsGoalsL1.id },
        data: { isActive: false, archivedAt: new Date() },
      });
      console.log('\n✓ Archived empty "Savings & Goals" EXPENSE L1');
    } else {
      console.log(`\n⚠ "Savings & Goals" still has ${remaining} active children — not archived`);
    }
  }

  console.log('\n✓ Done. Final structure:');
  console.log('  INVESTMENT > Sinking Funds > Medical Emergency Buffer (₹2,500)');
  console.log('  INVESTMENT > Sinking Funds > Back to School           (₹1,000)');
  console.log('  INVESTMENT > Sinking Funds > Vacation Fund            (₹4,000)');
  console.log('  EXPENSE    > House Hold    > Parents Support          (₹2,000)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
