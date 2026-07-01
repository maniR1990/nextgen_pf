/**
 * Balance Engine — server layer (prisma-dependent)
 *
 * Server-only. Do NOT import this in client components.
 * Import pure helpers (BALANCE_IMPACT, getBalanceDeltas, etc.) from './core'.
 */

import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';
import { type BalanceDelta, getBalanceDeltas } from './core';

export {
  BALANCE_IMPACT,
  type BalanceDelta,
  type BalanceImpact,
  getBalanceDeltas,
  getTxSignedAmount,
  reverseDeltas,
} from './core';

// ── Apply deltas inside a Prisma transaction (atomic) ─────────────────────

export async function applyDeltas(
  tx: Prisma.TransactionClient,
  delta: BalanceDelta,
): Promise<void> {
  const now = new Date();
  if (delta.kind === 'none') return;

  if (delta.kind === 'single') {
    await tx.account.update({
      where: { id: delta.accountId },
      data: { balance: { increment: delta.delta }, balanceAsOf: now },
    });
    return;
  }

  // transfer: update both accounts in parallel within the same db tx
  await Promise.all([
    tx.account.update({
      where: { id: delta.fromId },
      data: { balance: { decrement: delta.amount }, balanceAsOf: now },
    }),
    tx.account.update({
      where: { id: delta.toId },
      data: { balance: { increment: delta.amount }, balanceAsOf: now },
    }),
  ]);
}

// ── Ledger-based balance (the ground truth) ───────────────────────────────

type AnyPrismaClient = Prisma.TransactionClient | typeof prisma;

export async function computeLedgerBalance(
  db: AnyPrismaClient,
  accountId: string,
  openingBalance: number,
): Promise<number> {
  const rows = await db.financeTransaction.findMany({
    where: {
      OR: [{ accountId }, { toAccountId: accountId }],
      voidedAt: null,
    },
    select: { type: true, amount: true, accountId: true, toAccountId: true },
  });

  let balance = openingBalance;

  for (const row of rows) {
    const delta = getBalanceDeltas({
      type: row.type,
      amount: row.amount,
      accountId: row.accountId,
      toAccountId: row.toAccountId,
    });

    if (delta.kind === 'single' && delta.accountId === accountId) {
      balance += delta.delta;
    } else if (delta.kind === 'transfer') {
      if (delta.fromId === accountId) balance -= row.amount;
      if (delta.toId === accountId) balance += row.amount;
    }
  }

  return Number.parseFloat(balance.toFixed(2));
}

// ── Reconciliation ────────────────────────────────────────────────────────

export interface ReconciliationResult {
  accountId: string;
  storedBalance: number;
  computedBalance: number;
  drift: number; // storedBalance - computedBalance
  isDrifted: boolean; // |drift| >= ₹0.01
}

export async function reconcileAccount(accountId: string): Promise<ReconciliationResult> {
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: accountId },
    select: { balance: true, openingBalance: true },
  });

  const computedBalance = await computeLedgerBalance(prisma, accountId, account.openingBalance);
  const drift = Number.parseFloat((account.balance - computedBalance).toFixed(2));

  return {
    accountId,
    storedBalance: account.balance,
    computedBalance,
    drift,
    isDrifted: Math.abs(drift) >= 0.01,
  };
}

// ── Self-healing: fix a drifted account in-place ──────────────────────────

export async function healBalance(accountId: string): Promise<ReconciliationResult> {
  const result = await reconcileAccount(accountId);

  if (result.isDrifted) {
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: result.computedBalance, balanceAsOf: new Date() },
    });
    return { ...result, storedBalance: result.computedBalance, drift: 0, isDrifted: false };
  }

  return result;
}
