/**
 * Adjusts budget for family context: wife (homemaker) + daughter (4 yrs) + sole breadwinner
 *
 * Changes:
 *  - REMOVE: Cook (wife cooks at home)
 *  - MODIFY: Education items for 4-year-old context
 *  - ADD L1:  Family & Kids (daughter-specific needs)
 *  - ADD L2:  Wife's needs under Personal Care + Healthcare
 *  - ADD L1:  Daughter's Education Fund under INVESTMENT (critical — start at age 4)
 *  - ADD L2:  Family outings, daughter birthday under Celebrations
 */

import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const UID_EMAIL = 'mani.r16@gmail.com';
const Y = 2026;
const M = 7;

function slug(uid: string, prefix: string, name: string) {
  return `${uid}-${prefix}-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

async function upsertBudget(userId: string, categoryId: string, planned: number) {
  if (planned === 0) return;
  return prisma.budget.upsert({
    where: {
      userId_period_year_month_categoryId: {
        userId,
        period: 'MONTHLY',
        year: Y,
        month: M,
        categoryId,
      },
    },
    update: { plannedAmount: planned },
    create: {
      userId,
      period: 'MONTHLY',
      year: Y,
      month: M,
      categoryId,
      plannedAmount: planned,
      isRecurring: true,
    },
  });
}

async function upsertL1(
  uid: string,
  name: string,
  slugKey: string,
  parentId: string,
  type: string,
  order: number,
  icon?: string,
  color?: string,
) {
  const s = `${uid}-${slugKey}`;
  return prisma.category.upsert({
    where: { userId_slug: { userId: uid, slug: s } },
    update: { name },
    create: {
      userId: uid,
      name,
      slug: s,
      parentId,
      level: 1,
      path: `${type.toLowerCase()}/${slugKey}`,
      type: type as never,
      order,
      isSystem: false,
      isActive: true,
      icon,
      color,
    },
  });
}

async function upsertL2(
  uid: string,
  name: string,
  prefix: string,
  parentId: string,
  parentPath: string,
  type: string,
  order: number,
  planned: number,
) {
  const s = slug(uid, prefix, name);
  const cat = await prisma.category.upsert({
    where: { userId_slug: { userId: uid, slug: s } },
    update: { name, monthlyBudget: planned },
    create: {
      userId: uid,
      name,
      slug: s,
      parentId,
      level: 2,
      path: `${parentPath}/${s.split('-').slice(2).join('-')}`,
      type: type as never,
      order,
      monthlyBudget: planned,
      isSystem: false,
      isActive: true,
    },
  });
  await upsertBudget(uid, cat.id, planned);
  return cat;
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: UID_EMAIL } });
  if (!user) throw new Error('User not found');
  const uid = user.id;
  console.log(`✓ User: ${user.email}\n`);

  const expG = await prisma.category.findFirst({
    where: { level: 0, type: 'EXPENSE', isSystem: true },
  });
  const invG = await prisma.category.findFirst({
    where: { level: 0, type: 'INVESTMENT', isSystem: true },
  });
  if (!expG || !invG) throw new Error('Root groups missing');

  const householdL1 = await prisma.category.findFirst({
    where: { userId: uid, level: 1, name: { contains: 'House Hold', mode: 'insensitive' } },
  });
  const pcL1 = await prisma.category.findFirst({
    where: { userId: uid, slug: `${uid}-personal-care` },
  });
  const hcL1 = await prisma.category.findFirst({
    where: { userId: uid, slug: `${uid}-healthcare` },
  });
  const eduL1 = await prisma.category.findFirst({
    where: { userId: uid, slug: `${uid}-education` },
  });
  const celebL1 = await prisma.category.findFirst({
    where: { userId: uid, slug: `${uid}-celebrations-gifts` },
  });
  const sfL1 = await prisma.category.findFirst({
    where: { userId: uid, slug: `${uid}-sinking-funds` },
  });
  if (!householdL1 || !pcL1 || !hcL1 || !eduL1 || !celebL1 || !sfL1)
    throw new Error('Required L1s not found');

  // ── 1. REMOVE Cook — wife is homemaker ─────────────────────────────────
  console.log('── 1. Removing Cook (wife is homemaker)');
  const cook = await prisma.category.findFirst({
    where: { userId: uid, name: 'Cook', isActive: true },
  });
  if (cook) {
    await prisma.budget.deleteMany({
      where: { userId: uid, categoryId: cook.id, year: Y, month: M },
    });
    await prisma.category.update({
      where: { id: cook.id },
      data: { isActive: false, archivedAt: new Date() },
    });
    console.log('  ✓ Cook archived (₹3,000 freed)');
  } else {
    console.log('  ✓ Cook already removed');
  }

  // ── 2. RENAME Maid → "Maid / House Help" already correct ───────────────

  // ── 3. UPDATE Education — 4-year-old context ───────────────────────────
  console.log('\n── 2. Updating Education for 4-year-old');

  // Rename "School Fees / Tuition" → "Playschool / Nursery Fees"
  const schoolFees = await prisma.category.findFirst({
    where: {
      userId: uid,
      parentId: eduL1.id,
      name: { contains: 'School Fees', mode: 'insensitive' },
    },
  });
  if (schoolFees) {
    await prisma.category.update({
      where: { id: schoolFees.id },
      data: { name: 'Playschool / Nursery Fees' },
    });
    console.log('  ✓ "School Fees / Tuition" → "Playschool / Nursery Fees" (₹3,000)');
  }

  // Rename "Coaching / Extra Classes" → "Activity Classes (Swimming / Art / Dance)"
  const coaching = await prisma.category.findFirst({
    where: { userId: uid, parentId: eduL1.id, name: { contains: 'Coaching', mode: 'insensitive' } },
  });
  if (coaching) {
    await prisma.category.update({
      where: { id: coaching.id },
      data: { name: 'Activity Classes (Swimming / Art / Dance)', monthlyBudget: 2000 },
    });
    console.log('  ✓ "Coaching / Extra Classes" → "Activity Classes" (₹2,000)');
  }

  // ── 4. WIFE needs — add under Personal Care + Healthcare ───────────────
  console.log("\n── 3. Wife's needs");
  await upsertL2(
    uid,
    "Wife's Clothing / Sarees / Accessories",
    'pc',
    pcL1.id,
    'expense/personal-care',
    'EXPENSE',
    10,
    2000,
  );
  await upsertL2(
    uid,
    "Wife's Salon / Beauty / Parlour",
    'pc',
    pcL1.id,
    'expense/personal-care',
    'EXPENSE',
    11,
    1000,
  );
  await upsertL2(
    uid,
    "Wife's Healthcare / Gynaecologist",
    'hc',
    hcL1.id,
    'expense/healthcare',
    'EXPENSE',
    10,
    1000,
  );
  console.log("  ✓ Wife's Clothing / Accessories    ₹2,000");
  console.log("  ✓ Wife's Salon / Parlour            ₹1,000");
  console.log("  ✓ Wife's Healthcare                 ₹1,000");

  // ── 5. FAMILY & KIDS L1 — daughter-specific ────────────────────────────
  console.log('\n── 4. Family & Kids (daughter, age 4)');
  const fkL1 = await upsertL1(
    uid,
    'Family & Kids',
    'family-kids',
    expG.id,
    'EXPENSE',
    16,
    '👨‍👩‍👧',
    '#ec4899',
  );
  await upsertL2(
    uid,
    "Daughter's Clothing / Shoes / Uniform",
    'fk',
    fkL1.id,
    'expense/family-kids',
    'EXPENSE',
    1,
    1500,
  );
  await upsertL2(
    uid,
    "Daughter's Toys / Books / Learning",
    'fk',
    fkL1.id,
    'expense/family-kids',
    'EXPENSE',
    2,
    1000,
  );
  await upsertL2(
    uid,
    "Daughter's Nutrition / Health Drinks",
    'fk',
    fkL1.id,
    'expense/family-kids',
    'EXPENSE',
    3,
    1000,
  );
  await upsertL2(
    uid,
    'Pediatrician / Kids Healthcare',
    'fk',
    fkL1.id,
    'expense/family-kids',
    'EXPENSE',
    4,
    1000,
  );
  await upsertL2(
    uid,
    'Baby / Kids Essentials (misc)',
    'fk',
    fkL1.id,
    'expense/family-kids',
    'EXPENSE',
    5,
    500,
  );
  await upsertL2(
    uid,
    'Family Weekend Outing / Picnic',
    'fk',
    fkL1.id,
    'expense/family-kids',
    'EXPENSE',
    6,
    2000,
  );
  await upsertL2(
    uid,
    'Family Vacation (monthly provision)',
    'fk',
    fkL1.id,
    'expense/family-kids',
    'EXPENSE',
    7,
    0,
  );
  console.log("  ✓ Daughter's Clothing / Shoes        ₹1,500");
  console.log("  ✓ Daughter's Toys / Books            ₹1,000");
  console.log("  ✓ Daughter's Nutrition               ₹1,000");
  console.log('  ✓ Pediatrician / Kids Healthcare     ₹1,000');
  console.log('  ✓ Baby Essentials                    ₹500');
  console.log('  ✓ Family Weekend Outing              ₹2,000');

  // ── 6. DAUGHTER's Birthday under Celebrations ──────────────────────────
  console.log("\n── 5. Celebrations — Daughter's birthday");
  await upsertL2(
    uid,
    "Daughter's Birthday Party",
    'cel',
    celebL1.id,
    'expense/celebrations-gifts',
    'EXPENSE',
    11,
    1000,
  );
  await upsertL2(
    uid,
    'Kids School Friends Gifts',
    'cel',
    celebL1.id,
    'expense/celebrations-gifts',
    'EXPENSE',
    12,
    500,
  );
  console.log("  ✓ Daughter's Birthday Party         ₹1,000");
  console.log('  ✓ Kids School Friends Gifts         ₹500');

  // ── 7. CRITICAL — Daughter's Education Corpus (INVESTMENT) ─────────────
  console.log("\n── 6. CRITICAL: Daughter's Education Fund (INVESTMENT)");
  console.log('   She is 4 now. UG admission at 18 = 14 years away.');
  console.log('   ₹10,000/mo SIP at 12% CAGR for 14 yrs ≈ ₹52 Lakhs corpus');
  console.log('   ₹15,000/mo SIP at 12% CAGR for 14 yrs ≈ ₹78 Lakhs corpus');

  const dauEduL1 = await upsertL1(
    uid,
    "Daughter's Future",
    'daughter-future',
    invG.id,
    'INVESTMENT',
    16,
    '👧',
    '#f472b6',
  );
  await upsertL2(
    uid,
    'Education Corpus SIP (Equity)',
    'df',
    dauEduL1.id,
    'investment/daughter-future',
    'INVESTMENT',
    1,
    10000,
  );
  await upsertL2(
    uid,
    'Marriage / Life Milestone Fund',
    'df',
    dauEduL1.id,
    'investment/daughter-future',
    'INVESTMENT',
    2,
    5000,
  );
  await upsertL2(
    uid,
    'Sukanya Samriddhi Yojana (SSY)',
    'df',
    dauEduL1.id,
    'investment/daughter-future',
    'INVESTMENT',
    3,
    12500,
  );
  console.log('  ✓ Education Corpus SIP (Equity)     ₹10,000/mo');
  console.log('  ✓ Marriage / Life Milestone Fund     ₹5,000/mo');
  console.log(
    '  ✓ Sukanya Samriddhi Yojana (SSY)    ₹12,500/mo  ← Govt scheme, tax-free, for girl child',
  );

  // ── 8. SOLE BREADWINNER safety — add to Sinking Funds ─────────────────
  console.log('\n── 7. Sole breadwinner safety net');
  await upsertL2(
    uid,
    'Critical Illness / Disability Buffer',
    'sf',
    sfL1.id,
    'investment/sinking-funds',
    'INVESTMENT',
    11,
    2000,
  );
  await upsertL2(
    uid,
    'Job Loss / Income Gap Fund',
    'sf',
    sfL1.id,
    'investment/sinking-funds',
    'INVESTMENT',
    12,
    5000,
  );
  console.log('  ✓ Critical Illness Buffer            ₹2,000/mo');
  console.log('  ✓ Job Loss / Income Gap Fund         ₹5,000/mo  ← sole earner risk buffer');

  // ── Summary ─────────────────────────────────────────────────────────────
  const allBudgets = await prisma.budget.findMany({
    where: { userId: uid, year: Y, month: M, period: 'MONTHLY' },
    select: { plannedAmount: true, categoryId: true },
  });
  const expCats = await prisma.category.findMany({
    where: { userId: uid, type: 'EXPENSE', isActive: true },
    select: { id: true },
  });
  const invCats = await prisma.category.findMany({
    where: { userId: uid, type: 'INVESTMENT', isActive: true },
    select: { id: true },
  });
  const expIds = new Set(expCats.map((c) => c.id));
  const invIds = new Set(invCats.map((c) => c.id));
  const expTotal = allBudgets
    .filter((b) => expIds.has(b.categoryId))
    .reduce((s, b) => s + b.plannedAmount, 0);
  const invTotal = allBudgets
    .filter((b) => invIds.has(b.categoryId))
    .reduce((s, b) => s + b.plannedAmount, 0);
  const grand = expTotal + invTotal;

  console.log(`\n${'═'.repeat(58)}`);
  console.log('  FINAL BUDGET — Mani (Sole Breadwinner, Wife + Daughter 4yr)');
  console.log(`${'═'.repeat(58)}`);
  console.log(`  EXPENSE total       ₹${expTotal.toLocaleString('en-IN').padStart(10)}/mo`);
  console.log(`  INVESTMENT total    ₹${invTotal.toLocaleString('en-IN').padStart(10)}/mo`);
  console.log(`  GRAND TOTAL         ₹${grand.toLocaleString('en-IN').padStart(10)}/mo`);
  console.log(`  Investment ratio    ${((invTotal / grand) * 100).toFixed(1)}%`);
  console.log(`${'═'.repeat(58)}`);
  console.log('\n  SSY Note: Max ₹1.5L/year (₹12,500/mo) for Sukanya Samriddhi.');
  console.log('  Opens in Post Office / SBI for girl child under 10.');
  console.log('  Tax-free maturity. Lock-in till daughter turns 21.');
  console.log('\n  ⚠  Fill Income actuals in Budget page to see your savings rate.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
