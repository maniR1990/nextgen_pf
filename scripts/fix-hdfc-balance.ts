import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Sum all non-voided transactions per account directly via aggregation
  const txGroups = await prisma.financeTransaction.groupBy({
    by: ['accountId', 'type'],
    where: { voidedAt: null },
    _sum: { amount: true },
  });

  console.log('All transaction groups found:');
  for (const g of txGroups) {
    console.log(`  accountId=${g.accountId} type=${g.type} sum=₹${g._sum.amount}`);
  }

  const INCOME_TYPES = new Set(['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT']);
  const EXPENSE_TYPES = new Set(['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT', 'ATM_WITHDRAWAL']);

  // Build balance map
  const balanceMap = new Map<string, number>();
  for (const g of txGroups) {
    const id = g.accountId;
    const amt = g._sum.amount ?? 0;
    const cur = balanceMap.get(id) ?? 0;
    if (INCOME_TYPES.has(g.type)) balanceMap.set(id, cur + amt);
    else if (EXPENSE_TYPES.has(g.type)) balanceMap.set(id, cur - amt);
    else if (g.type === 'TRANSFER') balanceMap.set(id, cur - amt);
  }

  // Transfer inflows
  const inflows = await prisma.financeTransaction.groupBy({
    by: ['toAccountId'],
    where: { voidedAt: null, type: 'TRANSFER', toAccountId: { not: null } },
    _sum: { amount: true },
  });
  for (const g of inflows) {
    if (!g.toAccountId) continue;
    const cur = balanceMap.get(g.toAccountId) ?? 0;
    balanceMap.set(g.toAccountId, cur + (g._sum.amount ?? 0));
  }

  console.log('\nUpdating balances:');
  for (const [accountId, balance] of balanceMap) {
    const acc = await prisma.account.findUnique({
      where: { id: accountId },
      select: { name: true },
    });
    if (!acc) {
      console.log(`  ${accountId} — no account found, skipping`);
      continue;
    }
    await prisma.account.update({
      where: { id: accountId },
      data: { balance, balanceAsOf: new Date() },
    });
    console.log(`  ${acc.name}: ₹${balance.toLocaleString('en-IN')}`);
  }

  console.log('\n✓ Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
