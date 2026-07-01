/**
 * Full budget restructure + additions for mani.r16@gmail.com — July 2026
 *
 * 1. Moves:   Flowers|Temple → Celebrations & Gifts
 * 2. Adds:    Personal Care, Healthcare, Subscriptions, Education,
 *             Personal Development, Giving/Charity under EXPENSE
 *             Household Help items under existing House Hold
 * 3. Adds:    Equity, Tax-Saving, Debt, Gold, International under INVESTMENT
 * 4. Adds:    Income categories (Salary, Passive, Side)
 */

import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TARGET_EMAIL = 'mani.r16@gmail.com';
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
  slugPrefix: string,
  parentId: string,
  parentPath: string,
  type: string,
  order: number,
  planned: number,
) {
  const s = slug(uid, slugPrefix, name);
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
  const user = await prisma.user.findUnique({ where: { email: TARGET_EMAIL } });
  if (!user) throw new Error('User not found');
  const uid = user.id;
  console.log(`✓ User: ${user.email}\n`);

  // ── Root groups ─────────────────────────────────────────────────────────
  const expG = await prisma.category.findFirst({
    where: { level: 0, type: 'EXPENSE', isSystem: true },
  });
  const invG = await prisma.category.findFirst({
    where: { level: 0, type: 'INVESTMENT', isSystem: true },
  });
  const incG = await prisma.category.findFirst({
    where: { level: 0, type: 'INCOME', isSystem: true },
  });
  if (!expG || !invG || !incG) throw new Error('Root groups missing');

  // ── Existing L1s ─────────────────────────────────────────────────────────
  const celebL1 = await prisma.category.findFirst({
    where: { userId: uid, slug: `${uid}-celebrations-gifts` },
  });
  const householdL1 = await prisma.category.findFirst({
    where: { userId: uid, level: 1, name: { contains: 'House Hold', mode: 'insensitive' } },
  });
  const sfL1 = await prisma.category.findFirst({
    where: { userId: uid, slug: `${uid}-sinking-funds` },
  });
  if (!celebL1 || !householdL1 || !sfL1) throw new Error('Expected L1 categories not found');

  // ════════════════════════════════════════════════════════════════════════
  // 1. MOVE — Flowers | Temple | Others → Celebrations & Gifts
  // ════════════════════════════════════════════════════════════════════════
  console.log('── 1. Restructuring');
  const templeItem = await prisma.category.findFirst({
    where: { userId: uid, name: { contains: 'Flowers', mode: 'insensitive' }, isActive: true },
  });
  if (templeItem && templeItem.parentId !== celebL1.id) {
    await prisma.category.update({
      where: { id: templeItem.id },
      data: {
        parentId: celebL1.id,
        path: 'expense/celebrations-gifts/flowers-temple',
        type: 'EXPENSE',
      },
    });
    console.log('  ✓ Moved "Flowers | Temple | Others" → Celebrations & Gifts');
  } else {
    console.log('  ✓ "Flowers | Temple | Others" already correct');
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. EXPENSE — New L1 categories + items
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n── 2. EXPENSE additions');

  // Household Help (add to existing House Hold)
  console.log('\n  📁 House Hold — adding help items');
  await upsertL2(
    uid,
    'Maid / House Help',
    'hh',
    householdL1.id,
    'expense/household',
    'EXPENSE',
    11,
    3000,
  );
  await upsertL2(uid, 'Cook', 'hh', householdL1.id, 'expense/household', 'EXPENSE', 12, 3000);
  await upsertL2(
    uid,
    'Mobile / Phone Bill',
    'hh',
    householdL1.id,
    'expense/household',
    'EXPENSE',
    13,
    1000,
  );
  console.log('    Maid / House Help       ₹3,000');
  console.log('    Cook                    ₹3,000');
  console.log('    Mobile / Phone Bill     ₹1,000');

  // Personal Care
  console.log('\n  📁 Personal Care (new L1)');
  const pcL1 = await upsertL1(
    uid,
    'Personal Care',
    'personal-care',
    expG.id,
    'EXPENSE',
    15,
    '💇',
    '#f97316',
  );
  await upsertL2(
    uid,
    'Haircut / Grooming',
    'pc',
    pcL1.id,
    'expense/personal-care',
    'EXPENSE',
    1,
    500,
  );
  await upsertL2(
    uid,
    'Clothing / Footwear',
    'pc',
    pcL1.id,
    'expense/personal-care',
    'EXPENSE',
    2,
    2000,
  );
  await upsertL2(
    uid,
    'Accessories / Jewellery',
    'pc',
    pcL1.id,
    'expense/personal-care',
    'EXPENSE',
    3,
    1000,
  );
  console.log('    Haircut / Grooming              ₹500');
  console.log('    Clothing / Footwear             ₹2,000');
  console.log('    Accessories / Jewellery         ₹1,000');

  // Healthcare
  console.log('\n  📁 Healthcare (new L1)');
  const hcL1 = await upsertL1(
    uid,
    'Healthcare',
    'healthcare',
    expG.id,
    'EXPENSE',
    16,
    '🏥',
    '#ef4444',
  );
  await upsertL2(
    uid,
    'Doctor / Consultation',
    'hc',
    hcL1.id,
    'expense/healthcare',
    'EXPENSE',
    1,
    1000,
  );
  await upsertL2(
    uid,
    'Medicines / Pharmacy',
    'hc',
    hcL1.id,
    'expense/healthcare',
    'EXPENSE',
    2,
    1000,
  );
  await upsertL2(
    uid,
    'Lab Tests / Health Checkup',
    'hc',
    hcL1.id,
    'expense/healthcare',
    'EXPENSE',
    3,
    500,
  );
  console.log('    Doctor / Consultation           ₹1,000');
  console.log('    Medicines / Pharmacy            ₹1,000');
  console.log('    Lab Tests / Health Checkup      ₹500');

  // Subscriptions & Entertainment
  console.log('\n  📁 Subscriptions & Entertainment (new L1)');
  const subL1 = await upsertL1(
    uid,
    'Subscriptions & Entertainment',
    'subscriptions',
    expG.id,
    'EXPENSE',
    17,
    '📱',
    '#06b6d4',
  );
  await upsertL2(
    uid,
    'OTT (Netflix / Prime / Hotstar)',
    'sub',
    subL1.id,
    'expense/subscriptions',
    'EXPENSE',
    1,
    1000,
  );
  await upsertL2(
    uid,
    'Music / Podcasts / Apps',
    'sub',
    subL1.id,
    'expense/subscriptions',
    'EXPENSE',
    2,
    300,
  );
  await upsertL2(
    uid,
    'Movies / Outings / Events',
    'sub',
    subL1.id,
    'expense/subscriptions',
    'EXPENSE',
    3,
    1500,
  );
  console.log('    OTT subscriptions               ₹1,000');
  console.log('    Music / Podcasts / Apps         ₹300');
  console.log('    Movies / Outings / Events       ₹1,500');

  // Education
  console.log('\n  📁 Education (new L1)');
  const eduL1 = await upsertL1(
    uid,
    'Education',
    'education',
    expG.id,
    'EXPENSE',
    18,
    '📚',
    '#0ea5e9',
  );
  await upsertL2(
    uid,
    'School Fees / Tuition',
    'edu',
    eduL1.id,
    'expense/education',
    'EXPENSE',
    1,
    3000,
  );
  await upsertL2(
    uid,
    'Coaching / Extra Classes',
    'edu',
    eduL1.id,
    'expense/education',
    'EXPENSE',
    2,
    2000,
  );
  await upsertL2(
    uid,
    'Books / Stationery',
    'edu',
    eduL1.id,
    'expense/education',
    'EXPENSE',
    3,
    500,
  );
  console.log('    School Fees / Tuition           ₹3,000');
  console.log('    Coaching / Extra Classes        ₹2,000');
  console.log('    Books / Stationery              ₹500');

  // Personal Development
  console.log('\n  📁 Personal Development (new L1)');
  const pdL1 = await upsertL1(
    uid,
    'Personal Development',
    'personal-dev',
    expG.id,
    'EXPENSE',
    19,
    '🧠',
    '#7c3aed',
  );
  await upsertL2(
    uid,
    'Books / Audiobooks',
    'pd',
    pdL1.id,
    'expense/personal-dev',
    'EXPENSE',
    1,
    500,
  );
  await upsertL2(
    uid,
    'Online Courses / Certifications',
    'pd',
    pdL1.id,
    'expense/personal-dev',
    'EXPENSE',
    2,
    2000,
  );
  await upsertL2(
    uid,
    'Professional Memberships',
    'pd',
    pdL1.id,
    'expense/personal-dev',
    'EXPENSE',
    3,
    500,
  );
  console.log('    Books / Audiobooks              ₹500');
  console.log('    Online Courses / Certifications ₹2,000');
  console.log('    Professional Memberships        ₹500');

  // Giving & Charity (under Celebrations & Gifts)
  console.log('\n  📁 Celebrations & Gifts — adding charity');
  await upsertL2(
    uid,
    'Charitable Donations / NGO',
    'cel',
    celebL1.id,
    'expense/celebrations-gifts',
    'EXPENSE',
    10,
    1000,
  );
  console.log('    Charitable Donations / NGO      ₹1,000');

  // Emergency Fund top-up → Sinking Funds
  console.log('\n  📁 Sinking Funds — Emergency Fund');
  await upsertL2(
    uid,
    'Emergency Fund (6-mo buffer)',
    'sf',
    sfL1.id,
    'investment/sinking-funds',
    'INVESTMENT',
    10,
    10000,
  );
  console.log('    Emergency Fund (6-mo buffer)    ₹10,000');

  // ════════════════════════════════════════════════════════════════════════
  // 3. INVESTMENT — Wealth building categories
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n── 3. INVESTMENT additions');

  // Equity Investments
  console.log('\n  📁 Equity Investments (new L1)');
  const eqL1 = await upsertL1(
    uid,
    'Equity Investments',
    'equity',
    invG.id,
    'INVESTMENT',
    11,
    '📈',
    '#22c55e',
  );
  await upsertL2(
    uid,
    'Index Fund SIP — Nifty 50',
    'eq',
    eqL1.id,
    'investment/equity',
    'INVESTMENT',
    1,
    10000,
  );
  await upsertL2(
    uid,
    'Index Fund SIP — Midcap / Next50',
    'eq',
    eqL1.id,
    'investment/equity',
    'INVESTMENT',
    2,
    5000,
  );
  await upsertL2(
    uid,
    'Active Large Cap MF',
    'eq',
    eqL1.id,
    'investment/equity',
    'INVESTMENT',
    3,
    5000,
  );
  await upsertL2(
    uid,
    'Small / Micro Cap MF',
    'eq',
    eqL1.id,
    'investment/equity',
    'INVESTMENT',
    4,
    3000,
  );
  console.log('    Index Fund — Nifty 50           ₹10,000');
  console.log('    Index Fund — Midcap / Next50    ₹5,000');
  console.log('    Active Large Cap MF             ₹5,000');
  console.log('    Small / Micro Cap MF            ₹3,000');

  // Tax-Saving Investments (80C/80CCD)
  console.log('\n  📁 Tax-Saving Investments (new L1)');
  const txL1 = await upsertL1(
    uid,
    'Tax-Saving Investments',
    'tax-saving',
    invG.id,
    'INVESTMENT',
    12,
    '🏛️',
    '#f59e0b',
  );
  await upsertL2(
    uid,
    'ELSS SIP (80C)',
    'tx',
    txL1.id,
    'investment/tax-saving',
    'INVESTMENT',
    1,
    12500,
  );
  await upsertL2(
    uid,
    'PPF Contribution (80C)',
    'tx',
    txL1.id,
    'investment/tax-saving',
    'INVESTMENT',
    2,
    12500,
  );
  await upsertL2(
    uid,
    'NPS Tier-1 (80CCD 1B)',
    'tx',
    txL1.id,
    'investment/tax-saving',
    'INVESTMENT',
    3,
    4200,
  );
  await upsertL2(
    uid,
    'LIC / Life Insurance Premium',
    'tx',
    txL1.id,
    'investment/tax-saving',
    'INVESTMENT',
    4,
    2000,
  );
  console.log('    ELSS SIP (80C)                  ₹12,500');
  console.log('    PPF Contribution (80C)          ₹12,500');
  console.log('    NPS Tier-1 (80CCD 1B)           ₹4,200');
  console.log('    LIC / Life Insurance Premium    ₹2,000');

  // Debt & Fixed Income
  console.log('\n  📁 Debt & Fixed Income (new L1)');
  const dbL1 = await upsertL1(
    uid,
    'Debt & Fixed Income',
    'debt-fixed',
    invG.id,
    'INVESTMENT',
    13,
    '🏦',
    '#64748b',
  );
  await upsertL2(uid, 'FD / RD', 'df', dbL1.id, 'investment/debt-fixed', 'INVESTMENT', 1, 5000);
  await upsertL2(
    uid,
    'Debt Mutual Fund',
    'df',
    dbL1.id,
    'investment/debt-fixed',
    'INVESTMENT',
    2,
    3000,
  );
  console.log('    FD / RD                         ₹5,000');
  console.log('    Debt Mutual Fund                ₹3,000');

  // Gold
  console.log('\n  📁 Gold (new L1)');
  const goldL1 = await upsertL1(uid, 'Gold', 'gold', invG.id, 'INVESTMENT', 14, '🥇', '#eab308');
  await upsertL2(
    uid,
    'Sovereign Gold Bond (SGB)',
    'gd',
    goldL1.id,
    'investment/gold',
    'INVESTMENT',
    1,
    3000,
  );
  await upsertL2(
    uid,
    'Digital Gold / Gold ETF',
    'gd',
    goldL1.id,
    'investment/gold',
    'INVESTMENT',
    2,
    2000,
  );
  console.log('    Sovereign Gold Bond (SGB)       ₹3,000');
  console.log('    Digital Gold / Gold ETF         ₹2,000');

  // International
  console.log('\n  📁 International Investments (new L1)');
  const intL1 = await upsertL1(
    uid,
    'International Investments',
    'international',
    invG.id,
    'INVESTMENT',
    15,
    '🌍',
    '#3b82f6',
  );
  await upsertL2(
    uid,
    'US Index Fund (S&P 500)',
    'int',
    intL1.id,
    'investment/international',
    'INVESTMENT',
    1,
    5000,
  );
  await upsertL2(
    uid,
    'Global / Emerging Markets MF',
    'int',
    intL1.id,
    'investment/international',
    'INVESTMENT',
    2,
    2000,
  );
  console.log('    US Index Fund (S&P 500)         ₹5,000');
  console.log('    Global / Emerging Markets MF    ₹2,000');

  // ════════════════════════════════════════════════════════════════════════
  // 4. INCOME categories
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n── 4. INCOME categories');

  const priL1 = await upsertL1(
    uid,
    'Primary Income',
    'primary-income',
    incG.id,
    'INCOME',
    1,
    '💼',
    '#10b981',
  );
  await upsertL2(uid, 'Salary / CTC', 'inc', priL1.id, 'income/primary-income', 'INCOME', 1, 0);
  await upsertL2(uid, 'Business Income', 'inc', priL1.id, 'income/primary-income', 'INCOME', 2, 0);
  await upsertL2(
    uid,
    'Bonus / Incentive',
    'inc',
    priL1.id,
    'income/primary-income',
    'INCOME',
    3,
    0,
  );
  console.log('  📁 Primary Income → Salary, Business, Bonus (₹0 — fill your actuals)');

  const pasL1 = await upsertL1(
    uid,
    'Passive Income',
    'passive-income',
    incG.id,
    'INCOME',
    2,
    '💰',
    '#f59e0b',
  );
  await upsertL2(uid, 'Rental Income', 'pas', pasL1.id, 'income/passive-income', 'INCOME', 1, 0);
  await upsertL2(
    uid,
    'Dividend / Interest',
    'pas',
    pasL1.id,
    'income/passive-income',
    'INCOME',
    2,
    0,
  );
  await upsertL2(uid, 'Capital Gains', 'pas', pasL1.id, 'income/passive-income', 'INCOME', 3, 0);
  console.log('  📁 Passive Income → Rental, Dividends, Capital Gains');

  const sidL1 = await upsertL1(
    uid,
    'Side Income',
    'side-income',
    incG.id,
    'INCOME',
    3,
    '⚡',
    '#8b5cf6',
  );
  await upsertL2(
    uid,
    'Freelance / Consulting',
    'sid',
    sidL1.id,
    'income/side-income',
    'INCOME',
    1,
    0,
  );
  await upsertL2(uid, 'Referral / Cashback', 'sid', sidL1.id, 'income/side-income', 'INCOME', 2, 0);
  console.log('  📁 Side Income → Freelance, Referral/Cashback');

  // ════════════════════════════════════════════════════════════════════════
  // Summary
  // ════════════════════════════════════════════════════════════════════════
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

  console.log(`\n${'═'.repeat(55)}`);
  console.log('  UPDATED BUDGET SUMMARY');
  console.log(`${'═'.repeat(55)}`);
  console.log(`  EXPENSE total     ₹${expTotal.toLocaleString('en-IN').padStart(12)}/mo`);
  console.log(`  INVESTMENT total  ₹${invTotal.toLocaleString('en-IN').padStart(12)}/mo`);
  console.log(
    `  GRAND TOTAL       ₹${(expTotal + invTotal).toLocaleString('en-IN').padStart(12)}/mo`,
  );
  const pct = ((invTotal / (expTotal + invTotal)) * 100).toFixed(1);
  console.log(`  Investment ratio  ${pct}%`);
  console.log(`${'═'.repeat(55)}`);
  console.log('\n  ⚠  Income categories created with ₹0 — please fill actuals in the Budget page.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
