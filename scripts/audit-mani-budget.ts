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

  const cats = await prisma.category.findMany({
    where: { userId: user.id, isActive: true },
    select: {
      id: true,
      name: true,
      level: true,
      type: true,
      parentId: true,
      monthlyBudget: true,
      order: true,
    },
    orderBy: [{ type: 'asc' }, { level: 'asc' }, { order: 'asc' }],
  });

  const budgets = await prisma.budget.findMany({
    where: { userId: user.id, year: 2026, month: 7, period: 'MONTHLY' },
    select: { categoryId: true, plannedAmount: true },
  });
  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.plannedAmount]));
  const byId = new Map(cats.map((c) => [c.id, c]));

  let totalExpense = 0;
  let totalInvestment = 0;

  for (const type of ['EXPENSE', 'INVESTMENT', 'INCOME']) {
    const l1s = cats.filter((c) => c.type === type && c.level === 1);
    if (!l1s.length) continue;
    console.log(`\n═══ ${type} ═══`);
    for (const l1 of l1s) {
      const l2s = cats.filter((c) => c.parentId === l1.id);
      const l1Budget = budgetMap.get(l1.id) ?? 0;
      const l2Total = l2s.reduce((s, c) => s + (budgetMap.get(c.id) ?? 0), 0);
      const total = l1Budget + l2Total;
      console.log(`\n  ${l1.name}  [₹${total.toLocaleString('en-IN')}]`);
      if (type === 'EXPENSE') totalExpense += total;
      if (type === 'INVESTMENT') totalInvestment += total;
      for (const l2 of l2s) {
        const amt = budgetMap.get(l2.id) ?? 0;
        console.log(`    - ${l2.name.padEnd(50)} ₹${amt.toLocaleString('en-IN')}`);
      }
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Total EXPENSE planned:    ₹${totalExpense.toLocaleString('en-IN')}`);
  console.log(`Total INVESTMENT planned: ₹${totalInvestment.toLocaleString('en-IN')}`);
  console.log(
    `Grand total:              ₹${(totalExpense + totalInvestment).toLocaleString('en-IN')}`,
  );
}
main().finally(() => prisma.$disconnect());
