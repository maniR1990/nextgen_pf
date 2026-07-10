/**
 * Rebuilds admin@example.com into a coherent demo dataset: a fully closed
 * June 2026 plus July 2026 month-to-date (through the 10th), so the Budget,
 * Transactions, and Reports pages all have realistic data to exercise.
 *
 * Wipes: this user's transactions and budgets, plus a handful of leftover
 * test categories ("hello", "New category", duplicate "Groceries") that had
 * zero linked transactions. Rebuilds: a clean category set, a Cash In Hand
 * account (for ATM withdrawals), budgets for both months, ~45 transactions,
 * and recalculates every account balance from the resulting ledger using the
 * real balance-engine (so it matches exactly what the app itself would compute).
 */
import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { getBalanceDeltas } from '../src/lib/balance-engine/core';

const prisma = new PrismaClient();
const EMAIL = 'admin@example.com';

function slug(uid: string, prefix: string, name: string) {
  return `${uid}-${prefix}-${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
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
) {
  const s = slug(uid, slugPrefix, name);
  return prisma.category.upsert({
    where: { userId_slug: { userId: uid, slug: s } },
    update: { name },
    create: {
      userId: uid,
      name,
      slug: s,
      parentId,
      level: 2,
      path: `${parentPath}/${s.split('-').slice(2).join('-')}`,
      type: type as never,
      order,
      isSystem: false,
      isActive: true,
    },
  });
}

async function upsertBudget(uid: string, categoryId: string, year: number, month: number, planned: number) {
  return prisma.budget.upsert({
    where: {
      userId_period_year_month_categoryId: { userId: uid, period: 'MONTHLY', year, month, categoryId },
    },
    update: { plannedAmount: planned },
    create: {
      userId: uid,
      period: 'MONTHLY',
      year,
      month,
      categoryId,
      plannedAmount: planned,
      isRecurring: true,
    },
  });
}

interface TxSpec {
  date: Date;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ATM_WITHDRAWAL' | 'INVESTMENT';
  amount: number;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  merchant: string;
  method: 'UPI' | 'NEFT' | 'CARD_SWIPE' | 'CASH' | 'AUTO_DEBIT' | 'ATM';
}

async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
  const uid = user.id;
  console.log(`User: ${user.email} (${uid})\n`);

  // ════════════════════════════════════════════════════════════════════════
  // 1. Cleanup — wipe existing transactions/budgets, remove leftover test
  //    categories (only if they truly have zero linked transactions).
  // ════════════════════════════════════════════════════════════════════════
  console.log('── 1. Cleanup');

  const delTx = await prisma.financeTransaction.deleteMany({ where: { userId: uid } });
  console.log(`  Deleted ${delTx.count} existing transactions`);

  const delBudget = await prisma.budget.deleteMany({ where: { userId: uid } });
  console.log(`  Deleted ${delBudget.count} existing budget rows`);

  const junkCandidates = await prisma.category.findMany({
    where: {
      userId: uid,
      isSystem: false,
      OR: [{ name: 'hello' }, { name: 'New category' }, { name: 'Groceries' }],
    },
  });
  for (const cat of junkCandidates) {
    const children = await prisma.category.findMany({ where: { parentId: cat.id } });
    const ids = [cat.id, ...children.map((c) => c.id)];
    const txCount = await prisma.financeTransaction.count({ where: { categoryId: { in: ids } } });
    if (txCount > 0) {
      console.log(`  Skipping "${cat.name}" — has ${txCount} linked transactions`);
      continue;
    }
    if (children.length > 0) {
      await prisma.category.deleteMany({ where: { id: { in: children.map((c) => c.id) } } });
    }
    await prisma.category.delete({ where: { id: cat.id } });
    console.log(`  Deleted junk category "${cat.name}" (+${children.length} children)`);
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. Accounts — add a Cash In Hand account for ATM withdrawals to land in.
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n── 2. Accounts');

  const cashBankGroup = await prisma.accountGroup.findFirstOrThrow({
    where: { userId: uid, slug: 'cash-bank' },
  });
  const hdfcBank = await prisma.account.findFirstOrThrow({ where: { userId: uid, name: 'HDFC BANK' } });
  const iciciDirect = await prisma.account.findFirstOrThrow({ where: { userId: uid, name: 'ICICI DIRECT ' } });
  const mfAccount = await prisma.account.findFirstOrThrow({ where: { userId: uid, name: 'HDFC MID CAP fund' } });

  let cashAccount = await prisma.account.findFirst({ where: { userId: uid, name: 'Cash In Hand' } });
  if (!cashAccount) {
    cashAccount = await prisma.account.create({
      data: {
        userId: uid,
        groupId: cashBankGroup.id,
        name: 'Cash In Hand',
        code: 'ACC-CASH-01',
        type: 'CASH_ENVELOPE',
      },
    });
    console.log('  Created "Cash In Hand" account');
  } else {
    console.log('  "Cash In Hand" account already exists');
  }

  // ════════════════════════════════════════════════════════════════════════
  // 3. Categories — reuse existing Grocery/House Hold/Transport/Investment
  //    leaves, add a few new ones for a realistic 10-category spread.
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n── 3. Categories');

  const expGroup = await prisma.category.findFirstOrThrow({ where: { level: 0, type: 'EXPENSE', isSystem: true } });
  const incGroup = await prisma.category.findFirstOrThrow({ where: { level: 0, type: 'INCOME', isSystem: true } });

  const houseHold = await prisma.category.findFirstOrThrow({
    where: { userId: null, isSystem: true, name: 'House Hold', level: 1 },
  });
  const rent = await prisma.category.findFirstOrThrow({ where: { userId: null, isSystem: true, name: 'Rent / EMI' } });
  const electricity = await prisma.category.findFirstOrThrow({ where: { userId: null, isSystem: true, name: 'Electricity' } });
  const internet = await upsertL2(uid, 'Internet / Mobile', 'hh', houseHold.id, 'expense/household', 'EXPENSE', 3);
  const water = await upsertL2(uid, 'Water Bill', 'hh', houseHold.id, 'expense/household', 'EXPENSE', 4);

  const fuel = await prisma.category.findFirstOrThrow({ where: { userId: null, isSystem: true, name: 'Fuel' } });

  const grocery = await prisma.category.findFirstOrThrow({ where: { userId: uid, name: 'Grocery', level: 1 } });
  const vegies = await prisma.category.findFirstOrThrow({ where: { userId: uid, name: 'Vegies' } });
  const fruits = await prisma.category.findFirstOrThrow({ where: { userId: uid, name: 'Fruits' } });
  const rice = await prisma.category.findFirstOrThrow({ where: { userId: uid, name: 'Rice' } });
  const oilMilk = await prisma.category.findFirstOrThrow({ where: { userId: uid, name: 'Oil | Milk' } });
  const snacks = await prisma.category.findFirstOrThrow({ where: { userId: uid, name: 'Snacks' } });
  const meat = await prisma.category.findFirstOrThrow({ where: { userId: uid, name: 'Meat', parentId: grocery.id } });
  const dals = await prisma.category.findFirstOrThrow({ where: { userId: uid, name: 'Dals' } });

  const diningL1 = await upsertL1(uid, 'Dining & Entertainment', 'dining', expGroup.id, 'EXPENSE', 20, '🍽️', '#ec4899');
  const dining = await upsertL2(uid, 'Restaurants / Dining Out', 'de', diningL1.id, 'expense/dining', 'EXPENSE', 1);
  const movies = await upsertL2(uid, 'Movies / OTT', 'de', diningL1.id, 'expense/dining', 'EXPENSE', 2);

  const healthL1 = await upsertL1(uid, 'Healthcare', 'healthcare', expGroup.id, 'EXPENSE', 21, '🏥', '#ef4444');
  const doctor = await upsertL2(uid, 'Doctor / Medicines', 'hc', healthL1.id, 'expense/healthcare', 'EXPENSE', 1);

  const activeIncome = await prisma.category.findFirstOrThrow({
    where: { name: 'Active Income', level: 1, isSystem: true },
  });
  const salary = await prisma.category.findFirstOrThrow({ where: { name: 'Salary', isSystem: true } });
  const mutualFunds = await prisma.category.findFirstOrThrow({ where: { name: 'Mutual Funds', isSystem: true } });

  console.log('  ✓ Category set ready (12 expense leaves, 1 investment, 1 income)');
  void incGroup;
  void activeIncome;

  // ════════════════════════════════════════════════════════════════════════
  // 4. Budgets — same planned amounts for June and July (standard recurring
  //    monthly budget; July is still in progress so pace projection kicks in).
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n── 4. Budgets (June + July)');

  const PLANS: Array<[{ id: string }, number]> = [
    [rent, 15000],
    [electricity, 2500],
    [internet, 1200],
    [water, 400],
    [fuel, 3000],
    [vegies, 2000],
    [fruits, 1500],
    [rice, 1200],
    [oilMilk, 1500],
    [snacks, 800],
    [meat, 2500],
    [dals, 800],
    [dining, 3000],
    [movies, 1000],
    [doctor, 1500],
    [mutualFunds, 10000],
  ];
  for (const [cat, planned] of PLANS) {
    await upsertBudget(uid, cat.id, 2026, 6, planned);
    await upsertBudget(uid, cat.id, 2026, 7, planned);
  }
  console.log(`  ✓ ${PLANS.length} categories budgeted for both months`);

  // ════════════════════════════════════════════════════════════════════════
  // 5. Transactions — June 2026 (closed) + July 2026 (1st–10th, in progress)
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n── 5. Transactions');

  const d = (y: number, m: number, day: number) => new Date(Date.UTC(y, m - 1, day));

  const txs: TxSpec[] = [
    // ── June 2026 — fully closed month ──────────────────────────────────
    { date: d(2026, 6, 1), type: 'INCOME', amount: 85000, accountId: hdfcBank.id, categoryId: salary.id, merchant: 'Nagarro', method: 'NEFT' },
    { date: d(2026, 6, 2), type: 'EXPENSE', amount: 15000, accountId: hdfcBank.id, categoryId: rent.id, merchant: 'Landlord — House Rent', method: 'NEFT' },
    { date: d(2026, 6, 3), type: 'EXPENSE', amount: 2650, accountId: hdfcBank.id, categoryId: electricity.id, merchant: 'TNEB Electricity', method: 'UPI' },
    { date: d(2026, 6, 3), type: 'EXPENSE', amount: 1199, accountId: hdfcBank.id, categoryId: internet.id, merchant: 'Airtel Broadband', method: 'AUTO_DEBIT' },
    { date: d(2026, 6, 4), type: 'EXPENSE', amount: 380, accountId: hdfcBank.id, categoryId: water.id, merchant: 'Water Board', method: 'UPI' },
    { date: d(2026, 6, 5), type: 'EXPENSE', amount: 1500, accountId: hdfcBank.id, categoryId: fuel.id, merchant: 'Indian Oil', method: 'CARD_SWIPE' },
    { date: d(2026, 6, 5), type: 'ATM_WITHDRAWAL', amount: 5000, accountId: hdfcBank.id, toAccountId: cashAccount.id, merchant: 'ATM Withdrawal', method: 'ATM' },
    { date: d(2026, 6, 6), type: 'EXPENSE', amount: 450, accountId: cashAccount.id, categoryId: vegies.id, merchant: 'Local Vegetable Vendor', method: 'CASH' },
    { date: d(2026, 6, 6), type: 'EXPENSE', amount: 300, accountId: cashAccount.id, categoryId: fruits.id, merchant: 'Fruit Stall', method: 'CASH' },
    { date: d(2026, 6, 7), type: 'EXPENSE', amount: 600, accountId: hdfcBank.id, categoryId: rice.id, merchant: 'Big Bazaar', method: 'UPI' },
    { date: d(2026, 6, 8), type: 'EXPENSE', amount: 700, accountId: hdfcBank.id, categoryId: oilMilk.id, merchant: 'Big Bazaar', method: 'UPI' },
    { date: d(2026, 6, 9), type: 'EXPENSE', amount: 250, accountId: cashAccount.id, categoryId: snacks.id, merchant: 'Kirana Store', method: 'CASH' },
    { date: d(2026, 6, 10), type: 'EXPENSE', amount: 900, accountId: hdfcBank.id, categoryId: meat.id, merchant: 'Meat Shop', method: 'UPI' },
    { date: d(2026, 6, 11), type: 'EXPENSE', amount: 350, accountId: hdfcBank.id, categoryId: dals.id, merchant: 'Big Bazaar', method: 'UPI' },
    { date: d(2026, 6, 12), type: 'EXPENSE', amount: 1800, accountId: hdfcBank.id, categoryId: dining.id, merchant: 'Saravana Bhavan', method: 'CARD_SWIPE' },
    { date: d(2026, 6, 13), type: 'EXPENSE', amount: 1450, accountId: hdfcBank.id, categoryId: fuel.id, merchant: 'Indian Oil', method: 'CARD_SWIPE' },
    { date: d(2026, 6, 14), type: 'EXPENSE', amount: 649, accountId: hdfcBank.id, categoryId: movies.id, merchant: 'Netflix', method: 'AUTO_DEBIT' },
    { date: d(2026, 6, 15), type: 'INVESTMENT', amount: 10000, accountId: hdfcBank.id, toAccountId: mfAccount.id, categoryId: mutualFunds.id, merchant: 'HDFC Mid Cap SIP', method: 'AUTO_DEBIT' },
    { date: d(2026, 6, 16), type: 'EXPENSE', amount: 500, accountId: cashAccount.id, categoryId: vegies.id, merchant: 'Local Vegetable Vendor', method: 'CASH' },
    { date: d(2026, 6, 17), type: 'EXPENSE', amount: 850, accountId: hdfcBank.id, categoryId: doctor.id, merchant: 'Apollo Pharmacy', method: 'UPI' },
    { date: d(2026, 6, 18), type: 'EXPENSE', amount: 350, accountId: cashAccount.id, categoryId: fruits.id, merchant: 'Fruit Stall', method: 'CASH' },
    { date: d(2026, 6, 19), type: 'EXPENSE', amount: 1200, accountId: hdfcBank.id, categoryId: dining.id, merchant: 'Zomato', method: 'UPI' },
    { date: d(2026, 6, 20), type: 'EXPENSE', amount: 300, accountId: cashAccount.id, categoryId: snacks.id, merchant: 'Kirana Store', method: 'CASH' },
    { date: d(2026, 6, 21), type: 'EXPENSE', amount: 550, accountId: hdfcBank.id, categoryId: rice.id, merchant: 'Big Bazaar', method: 'UPI' },
    { date: d(2026, 6, 22), type: 'TRANSFER', amount: 5000, accountId: hdfcBank.id, toAccountId: iciciDirect.id, merchant: 'Transfer to ICICI Direct', method: 'NEFT' },
    { date: d(2026, 6, 23), type: 'EXPENSE', amount: 750, accountId: hdfcBank.id, categoryId: meat.id, merchant: 'Meat Shop', method: 'UPI' },
    { date: d(2026, 6, 24), type: 'EXPENSE', amount: 650, accountId: hdfcBank.id, categoryId: oilMilk.id, merchant: 'Big Bazaar', method: 'UPI' },
    { date: d(2026, 6, 25), type: 'EXPENSE', amount: 1600, accountId: hdfcBank.id, categoryId: fuel.id, merchant: 'Indian Oil', method: 'CARD_SWIPE' },
    { date: d(2026, 6, 26), type: 'EXPENSE', amount: 400, accountId: cashAccount.id, categoryId: vegies.id, merchant: 'Local Vegetable Vendor', method: 'CASH' },
    { date: d(2026, 6, 27), type: 'EXPENSE', amount: 950, accountId: hdfcBank.id, categoryId: dining.id, merchant: 'Saravana Bhavan', method: 'CARD_SWIPE' },
    { date: d(2026, 6, 28), type: 'EXPENSE', amount: 300, accountId: hdfcBank.id, categoryId: dals.id, merchant: 'Big Bazaar', method: 'UPI' },
    { date: d(2026, 6, 29), type: 'EXPENSE', amount: 200, accountId: cashAccount.id, categoryId: snacks.id, merchant: 'Kirana Store', method: 'CASH' },
    { date: d(2026, 6, 30), type: 'EXPENSE', amount: 399, accountId: hdfcBank.id, categoryId: movies.id, merchant: 'Prime Video', method: 'AUTO_DEBIT' },

    // ── July 2026 — month to date (1st–10th) ────────────────────────────
    { date: d(2026, 7, 1), type: 'INCOME', amount: 85000, accountId: hdfcBank.id, categoryId: salary.id, merchant: 'Nagarro', method: 'NEFT' },
    { date: d(2026, 7, 2), type: 'EXPENSE', amount: 15000, accountId: hdfcBank.id, categoryId: rent.id, merchant: 'Landlord — House Rent', method: 'NEFT' },
    { date: d(2026, 7, 2), type: 'EXPENSE', amount: 2400, accountId: hdfcBank.id, categoryId: electricity.id, merchant: 'TNEB Electricity', method: 'UPI' },
    { date: d(2026, 7, 3), type: 'EXPENSE', amount: 1199, accountId: hdfcBank.id, categoryId: internet.id, merchant: 'Airtel Broadband', method: 'AUTO_DEBIT' },
    { date: d(2026, 7, 3), type: 'ATM_WITHDRAWAL', amount: 4000, accountId: hdfcBank.id, toAccountId: cashAccount.id, merchant: 'ATM Withdrawal', method: 'ATM' },
    { date: d(2026, 7, 4), type: 'EXPENSE', amount: 500, accountId: cashAccount.id, categoryId: vegies.id, merchant: 'Local Vegetable Vendor', method: 'CASH' },
    { date: d(2026, 7, 4), type: 'EXPENSE', amount: 350, accountId: cashAccount.id, categoryId: fruits.id, merchant: 'Fruit Stall', method: 'CASH' },
    { date: d(2026, 7, 5), type: 'EXPENSE', amount: 1500, accountId: hdfcBank.id, categoryId: fuel.id, merchant: 'Indian Oil', method: 'CARD_SWIPE' },
    { date: d(2026, 7, 6), type: 'EXPENSE', amount: 600, accountId: hdfcBank.id, categoryId: rice.id, merchant: 'Big Bazaar', method: 'UPI' },
    { date: d(2026, 7, 7), type: 'EXPENSE', amount: 1100, accountId: hdfcBank.id, categoryId: dining.id, merchant: 'Zomato', method: 'UPI' },
    { date: d(2026, 7, 8), type: 'EXPENSE', amount: 800, accountId: hdfcBank.id, categoryId: meat.id, merchant: 'Meat Shop', method: 'UPI' },
    { date: d(2026, 7, 9), type: 'EXPENSE', amount: 300, accountId: cashAccount.id, categoryId: snacks.id, merchant: 'Kirana Store', method: 'CASH' },
    { date: d(2026, 7, 10), type: 'EXPENSE', amount: 650, accountId: hdfcBank.id, categoryId: oilMilk.id, merchant: 'Big Bazaar', method: 'UPI' },
  ];

  for (const tx of txs) {
    await prisma.financeTransaction.create({
      data: {
        userId: uid,
        date: tx.date,
        budgetPeriodYear: tx.date.getUTCFullYear(),
        budgetPeriodMonth: tx.date.getUTCMonth() + 1,
        type: tx.type,
        amount: tx.amount,
        currency: 'INR',
        accountId: tx.accountId,
        toAccountId: tx.toAccountId,
        categoryId: tx.categoryId,
        paymentMethod: tx.method,
        isPlanned: true,
        isRecurring: false,
        status: 'CLEARED',
        merchant: tx.merchant,
        idempotencyKey: randomUUID(),
      },
    });
  }
  const juneCount = txs.filter((t) => t.date.getUTCMonth() === 5).length;
  const julyCount = txs.filter((t) => t.date.getUTCMonth() === 6).length;
  console.log(`  ✓ Created ${txs.length} transactions (${juneCount} in June, ${julyCount} in July)`);

  // ════════════════════════════════════════════════════════════════════════
  // 6. Recalculate every account balance from the ledger using the real
  //    balance-engine — the single source of truth the app itself uses.
  // ════════════════════════════════════════════════════════════════════════
  console.log('\n── 6. Recalculating account balances');

  // MongoDB: `{ voidedAt: null }` only matches explicitly-stored null, not the
  // absent field these freshly-created rows have — filter in JS instead.
  const allTxsRaw = await prisma.financeTransaction.findMany({
    where: { userId: uid },
    select: { type: true, amount: true, accountId: true, toAccountId: true, voidedAt: true },
  });
  const allTxs = allTxsRaw.filter((t) => t.voidedAt == null);

  const deltas = new Map<string, number>();
  const bump = (id: string, amt: number) => deltas.set(id, (deltas.get(id) ?? 0) + amt);

  for (const tx of allTxs) {
    const delta = getBalanceDeltas({
      type: tx.type,
      amount: tx.amount,
      accountId: tx.accountId,
      toAccountId: tx.toAccountId,
    });
    if (delta.kind === 'single') bump(delta.accountId, delta.delta);
    else if (delta.kind === 'transfer') {
      bump(delta.fromId, -delta.amount);
      bump(delta.toId, delta.amount);
    }
  }

  const accounts = await prisma.account.findMany({ where: { userId: uid }, select: { id: true, name: true } });
  for (const acc of accounts) {
    const balance = deltas.get(acc.id) ?? 0;
    await prisma.account.update({ where: { id: acc.id }, data: { balance, balanceAsOf: new Date() } });
    console.log(`  ${acc.name.padEnd(20)} → ₹${balance.toLocaleString('en-IN')}`);
  }

  console.log('\n✓ Demo month rebuild complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
