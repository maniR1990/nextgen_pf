import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const MANI_ID = '6a446d56dabb3478c4ac24c2';
const INCOME_TYPES = new Set(['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT']);
const EXPENSE_TYPES = new Set(['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT', 'ATM_WITHDRAWAL']);

async function main() {
  const txs = await prisma.financeTransaction.findMany({
    where: { userId: MANI_ID, voidedAt: null },
    select: { accountId: true, toAccountId: true, type: true, amount: true },
  });
  console.log(`Found ${txs.length} transactions\n`);

  const delta = new Map<string, number>();
  const add = (id: string, n: number) => delta.set(id, (delta.get(id) ?? 0) + n);

  for (const tx of txs) {
    if (INCOME_TYPES.has(tx.type)) add(tx.accountId, +tx.amount);
    else if (EXPENSE_TYPES.has(tx.type)) add(tx.accountId, -tx.amount);
    else if (tx.type === 'TRANSFER') {
      add(tx.accountId, -tx.amount);
      if (tx.toAccountId) add(tx.toAccountId, +tx.amount);
    }
  }

  const accounts = await prisma.account.findMany({
    where: { userId: MANI_ID },
    select: { id: true, name: true },
  });

  for (const acc of accounts) {
    const balance = delta.get(acc.id) ?? 0;
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
