/**
 * Balance Reconciliation Script
 *
 * Recomputes every account's balance from its opening balance + ledger transactions.
 * Safe to re-run — idempotent. Only writes when drift is detected.
 *
 * Usage:
 *   npx tsx scripts/reconcile-balances.ts            # dry-run, shows drift
 *   npx tsx scripts/reconcile-balances.ts --fix      # apply corrections
 *   npx tsx scripts/reconcile-balances.ts --fix --email mani.r16@gmail.com
 */

import { loadEnvFiles } from './loadEnv';
loadEnvFiles();

import { PrismaClient } from '@prisma/client';
import { getBalanceDeltas } from '../src/lib/balance-engine';

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const DRY = !args.includes('--fix');
const EMAIL = args[args.indexOf('--email') + 1] as string | undefined;

async function main() {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(
    `  Balance Reconciliation  ${DRY ? '(DRY RUN — pass --fix to apply)' : '(LIVE — writing corrections)'}`,
  );
  if (EMAIL) console.log(`  Scoped to: ${EMAIL}`);
  console.log(`${'═'.repeat(60)}\n`);

  const userFilter = EMAIL
    ? { userId: (await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } })).id }
    : {};

  const accounts = await prisma.account.findMany({
    where: userFilter,
    select: { id: true, name: true, balance: true, openingBalance: true, userId: true },
    orderBy: { name: 'asc' },
  });

  let driftCount = 0;

  for (const acc of accounts) {
    // Fetch all non-voided transactions touching this account
    const rows = await prisma.financeTransaction.findMany({
      where: {
        OR: [{ accountId: acc.id }, { toAccountId: acc.id }],
        voidedAt: null,
      },
      select: { type: true, amount: true, accountId: true, toAccountId: true },
    });

    let computed = acc.openingBalance;
    for (const row of rows) {
      const delta = getBalanceDeltas({
        type: row.type,
        amount: row.amount,
        accountId: row.accountId,
        toAccountId: row.toAccountId,
      });

      if (delta.kind === 'single' && delta.accountId === acc.id) {
        computed += delta.delta;
      } else if (delta.kind === 'transfer') {
        if (delta.fromId === acc.id) computed -= row.amount;
        if (delta.toId === acc.id) computed += row.amount;
      }
    }

    computed = Number.parseFloat(computed.toFixed(2));
    const stored = acc.balance;
    const drift = Number.parseFloat((stored - computed).toFixed(2));
    const drifted = Math.abs(drift) >= 0.01;

    const label = acc.name.padEnd(28);
    if (!drifted) {
      console.log(`  ✓  ${label} ₹${stored.toLocaleString('en-IN').padStart(12)}  (ok)`);
      continue;
    }

    driftCount++;
    console.log(
      `  ✗  ${label} stored=₹${stored.toLocaleString('en-IN')}  computed=₹${computed.toLocaleString('en-IN')}  drift=${drift >= 0 ? '+' : ''}${drift}`,
    );

    if (!DRY) {
      await prisma.account.update({
        where: { id: acc.id },
        data: { balance: computed, balanceAsOf: new Date() },
      });
      console.log(`     ↳ corrected to ₹${computed.toLocaleString('en-IN')}`);
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  if (driftCount === 0) {
    console.log('  All balances are correct. No drift detected.\n');
  } else if (DRY) {
    console.log(`  ${driftCount} account(s) have drift. Run with --fix to correct.\n`);
  } else {
    console.log(`  ${driftCount} account(s) corrected.\n`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
