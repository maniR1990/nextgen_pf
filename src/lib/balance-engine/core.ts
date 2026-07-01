/**
 * Balance Engine — pure core (no server dependencies)
 *
 * Safe to import in both client and server components.
 *
 * Rules:
 *   - BALANCE_IMPACT is the single source of truth for how every TxType
 *     affects money. Adding a new TxType without updating this map is a
 *     compile-time error (Record<TxType, BalanceImpact> is exhaustive).
 *   - getTxSignedAmount derives display sign from BALANCE_IMPACT — the same
 *     logic that drives balance mutations also drives UI rendering.
 */

import type { TxType } from '@/constants/finance';

// ── Impact classification ─────────────────────────────────────────────────
//
// credit   → +amount to accountId
// debit    → -amount from accountId
// transfer → -amount from accountId, +amount to toAccountId
// none     → no real money movement (discounts, points)

export type BalanceImpact = 'credit' | 'debit' | 'transfer' | 'none';

export const BALANCE_IMPACT: Record<TxType, BalanceImpact> = {
  // Inflows — money arrives in the account
  INCOME: 'credit',
  GIFT_RECEIVED: 'credit',
  REIMBURSEMENT: 'credit',
  REFUND: 'credit',

  // Outflows — money leaves the account
  EXPENSE: 'debit',
  INVESTMENT: 'debit',
  SINKING_DEPOSIT: 'debit',

  // Movements — money leaves one account and enters another
  TRANSFER: 'transfer',
  ATM_WITHDRAWAL: 'transfer', // bank → cash wallet / ATM buffer account

  // No cash movement — discounts or points applied at point of sale
  COUPON_REDEMPTION: 'none',
  POINTS_REDEMPTION: 'none',
};

// ── Delta shape ───────────────────────────────────────────────────────────

export type BalanceDelta =
  | { kind: 'none' }
  | { kind: 'single'; accountId: string; delta: number }
  | { kind: 'transfer'; fromId: string; toId: string; amount: number };

// ── Compute deltas from a transaction ─────────────────────────────────────

export function getBalanceDeltas(tx: {
  type: string;
  amount: number;
  accountId: string;
  toAccountId?: string | null;
}): BalanceDelta {
  const impact = BALANCE_IMPACT[tx.type as TxType];

  switch (impact) {
    case 'credit':
      return { kind: 'single', accountId: tx.accountId, delta: +tx.amount };

    case 'debit':
      return { kind: 'single', accountId: tx.accountId, delta: -tx.amount };

    case 'transfer':
      // Degenerate: no destination account → treat as a plain debit
      if (!tx.toAccountId) {
        return { kind: 'single', accountId: tx.accountId, delta: -tx.amount };
      }
      return { kind: 'transfer', fromId: tx.accountId, toId: tx.toAccountId, amount: tx.amount };
    default:
      return { kind: 'none' };
  }
}

// ── Reverse a delta (void / delete / undo) ────────────────────────────────

export function reverseDeltas(delta: BalanceDelta): BalanceDelta {
  switch (delta.kind) {
    case 'single':
      return { ...delta, delta: -delta.delta };
    case 'transfer':
      // Swap from/to so the original debit becomes a credit and vice-versa
      return { ...delta, fromId: delta.toId, toId: delta.fromId };
    case 'none':
      return delta;
  }
}

// ── Signed display amount ─────────────────────────────────────────────────
//
// Returns the amount with the correct sign from the perspective of
// `viewAccountId`. Positive = money came in, Negative = money went out.
// Use this for every transaction amount displayed in the UI — never derive
// sign from the transaction type manually.

export function getTxSignedAmount(
  tx: {
    type: string;
    amount: number;
    accountId: string;
    toAccountId?: string | null;
  },
  viewAccountId: string,
): number {
  const impact = BALANCE_IMPACT[tx.type as TxType] ?? 'none';

  switch (impact) {
    case 'credit':
      return Math.abs(tx.amount);

    case 'debit':
      return -Math.abs(tx.amount);

    case 'transfer':
      // Money arriving at this account → positive; leaving → negative
      return tx.toAccountId === viewAccountId ? Math.abs(tx.amount) : -Math.abs(tx.amount);
    default:
      // Redemptions have no cash impact — show as neutral positive
      return Math.abs(tx.amount);
  }
}
