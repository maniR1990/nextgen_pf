/**
 * Recalculates every account's balance from its non-voided transactions.
 * Uses a fresh PrismaClient per account query to avoid any stale state.
 */
import { loadEnvFiles } from './loadEnv';
loadEnvFiles();
import { PrismaClient } from '@prisma/client';

const INCOME_TYPES = new Set(['INCOME', 'GIFT_RECEIVED', 'REIMBURSEMENT']);
const EXPENSE_TYPES = new Set(['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT', 'ATM_WITHDRAWAL']);

async function main() {
  const prisma = new PrismaClient();

  const accounts = await prisma.account.findMany({ select: { id: true, name: true } });
  console.log(`${accounts.length} accounts to process\n`);

  for (const acc of accounts) {
    // Fresh client per iteration to avoid any caching
    const p = new PrismaClient();
    try {
      const txs = await p.financeTransaction.findMany({
        where: { accountId: acc.id, voidedAt: null },
        select: { type: true, amount: true },
      });
      const inflows = await p.financeTransaction.findMany({
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

      await p.account.update({ where: { id: acc.id }, data: { balance, balanceAsOf: new Date() } });
      console.log(
        `  ${acc.name.padEnd(24)} ${txs.length} txs  → ₹${balance.toLocaleString('en-IN')}`,
      );
    } finally {
      await p.$disconnect();
    }
  }

  console.log('\n✓ All balances updated.');
  await prisma.$disconnect();
}

main().catch(console.error);
