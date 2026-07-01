import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const INCOME_TYPES = new Set(['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT']);
const EXPENSE_TYPES = new Set(['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT', 'ATM_WITHDRAWAL']);

async function main() {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: 'mani.r16@gmail.com' } });
  console.log(`✓ User: ${user.email}`);

  const accounts = await prisma.account.findMany({ where: { userId: user.id } });

  for (const acc of accounts) {
    const txs = await prisma.financeTransaction.findMany({
      where: { accountId: acc.id, voidedAt: null },
      select: { type: true, amount: true },
    });
    const inflows = await prisma.financeTransaction.findMany({
      where: { toAccountId: acc.id, voidedAt: null, type: 'TRANSFER' },
      select: { amount: true },
    });

    let balance = 0;
    for (const tx of txs) {
      if (INCOME_TYPES.has(tx.type)) balance += tx.amount;
      else if (EXPENSE_TYPES.has(tx.type)) balance -= tx.amount;
      else if (tx.type === 'TRANSFER') balance -= tx.amount;
    }
    for (const tx of inflows) balance += tx.amount;

    console.log(
      `  ${acc.name}: ${txs.length} txs, inflows ${inflows.length}, balance → ₹${balance.toLocaleString('en-IN')}`,
    );
    await prisma.account.update({
      where: { id: acc.id },
      data: { balance, balanceAsOf: new Date() },
    });
  }

  console.log('\n✓ Done.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
