import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const INCOME_TYPES = new Set(['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT']);
const EXPENSE_TYPES = new Set(['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT', 'ATM_WITHDRAWAL']);

async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'mani.r16@gmail.com' } });
  console.log(`User: ${user.email} (${user.id})\n`);

  // Get all transactions for this user
  const allTxs = await prisma.financeTransaction.findMany({
    where: { userId: user.id, voidedAt: null },
    select: { accountId: true, toAccountId: true, type: true, amount: true },
  });
  console.log(`Found ${allTxs.length} transactions\n`);

  // Build balance deltas per accountId
  const balanceMap = new Map<string, number>();
  const add = (id: string, n: number) => balanceMap.set(id, (balanceMap.get(id) ?? 0) + n);

  for (const tx of allTxs) {
    if (INCOME_TYPES.has(tx.type)) add(tx.accountId, +tx.amount);
    else if (EXPENSE_TYPES.has(tx.type)) add(tx.accountId, -tx.amount);
    else if (tx.type === 'TRANSFER') {
      add(tx.accountId, -tx.amount);
      if (tx.toAccountId) add(tx.toAccountId, +tx.amount);
    }
  }

  // Apply to accounts
  const accounts = await prisma.account.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  for (const acc of accounts) {
    const balance = balanceMap.get(acc.id) ?? 0;
    await prisma.account.update({
      where: { id: acc.id },
      data: { balance, balanceAsOf: new Date() },
    });
    console.log(`  ${acc.name.padEnd(24)} ₹${balance.toLocaleString('en-IN')}`);
  }

  console.log('\n✓ Done.');
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
