import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'mani.r16@gmail.com' },
    select: { id: true },
  });
  if (!user) throw new Error('User not found');

  const allCats = await prisma.category.findMany({
    where: { isActive: true, OR: [{ userId: user.id }, { isSystem: true }] },
    select: {
      id: true,
      name: true,
      level: true,
      type: true,
      parentId: true,
      order: true,
      isSystem: true,
      userId: true,
    },
    orderBy: [{ type: 'asc' }, { level: 'asc' }, { order: 'asc' }],
  });

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, year: 2026, month: 7, period: 'MONTHLY' },
    select: { categoryId: true, plannedAmount: true },
  });
  const bMap = new Map(budgets.map((b) => [b.categoryId, b.plannedAmount]));
  const byId = new Map(allCats.map((c) => [c.id, c]));

  // All user-owned L2s that have a budget
  const userL2s = allCats.filter((c) => c.userId === user.id && c.level === 2);
  // Collect parent L1 ids
  const parentIds = new Set(userL2s.map((c) => c.parentId).filter(Boolean) as string[]);
  // All L1s (user or system) that are parents of user L2s, OR are user-owned L1s
  const userL1s = allCats.filter(
    (c) => c.level === 1 && (c.userId === user.id || parentIds.has(c.id)),
  );

  let totalExpense = 0;
  let totalInvestment = 0;

  for (const type of ['EXPENSE', 'INVESTMENT']) {
    const l1s = userL1s.filter((c) => c.type === type);
    if (!l1s.length) continue;
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`  ${type}`);
    console.log(`${'═'.repeat(65)}`);

    for (const l1 of l1s) {
      const children = userL2s
        .filter((c) => c.parentId === l1.id)
        .sort((a, b) => a.order - b.order);
      const l2Total = children.reduce((s, c) => s + (bMap.get(c.id) ?? 0), 0);
      const l1Amt = bMap.get(l1.id) ?? 0;
      const total = l1Amt + l2Total;
      if (type === 'EXPENSE') totalExpense += total;
      else totalInvestment += total;
      const tag = l1.isSystem ? ' [sys]' : '';
      console.log(`\n  📁 ${l1.name}${tag}   ₹${total.toLocaleString('en-IN')}/mo`);
      for (const c of children) {
        const amt = bMap.get(c.id) ?? 0;
        console.log(
          `       ${c.name.padEnd(52)} ₹${String(amt.toLocaleString('en-IN')).padStart(8)}`,
        );
      }
    }
  }

  const grand = totalExpense + totalInvestment;
  console.log(`\n${'─'.repeat(65)}`);
  console.log(`  EXPENSE total    ₹${totalExpense.toLocaleString('en-IN').padStart(12)}/mo`);
  console.log(`  INVESTMENT total ₹${totalInvestment.toLocaleString('en-IN').padStart(12)}/mo`);
  console.log(`  GRAND TOTAL      ₹${grand.toLocaleString('en-IN').padStart(12)}/mo`);
  console.log(`${'─'.repeat(65)}`);
}
main().finally(() => prisma.$disconnect());
