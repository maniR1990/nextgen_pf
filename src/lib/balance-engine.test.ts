import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock prisma before importing the engine so reconcileAccount uses the mock
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    account: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    financeTransaction: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';
import {
  BALANCE_IMPACT,
  computeLedgerBalance,
  getBalanceDeltas,
  reconcileAccount,
  reverseDeltas,
} from './balance-engine';

beforeEach(() => vi.clearAllMocks());

// ── BALANCE_IMPACT coverage ───────────────────────────────────────────────────

describe('BALANCE_IMPACT', () => {
  it('classifies every inflow type as credit', () => {
    expect(BALANCE_IMPACT.INCOME).toBe('credit');
    expect(BALANCE_IMPACT.GIFT_RECEIVED).toBe('credit');
    expect(BALANCE_IMPACT.REIMBURSEMENT).toBe('credit');
    expect(BALANCE_IMPACT.REFUND).toBe('credit');
  });

  it('classifies every outflow type as debit', () => {
    expect(BALANCE_IMPACT.EXPENSE).toBe('debit');
    expect(BALANCE_IMPACT.SINKING_DEPOSIT).toBe('debit');
  });

  it('classifies movement types as transfer', () => {
    expect(BALANCE_IMPACT.TRANSFER).toBe('transfer');
    expect(BALANCE_IMPACT.ATM_WITHDRAWAL).toBe('transfer');
    // INVESTMENT moves money from a bank/wallet into a holding account (demat, MF
    // folio, PPF, ...) rather than spending it — same shape as TRANSFER, not EXPENSE.
    expect(BALANCE_IMPACT.INVESTMENT).toBe('transfer');
  });

  it('classifies redemption types as none', () => {
    expect(BALANCE_IMPACT.COUPON_REDEMPTION).toBe('none');
    expect(BALANCE_IMPACT.POINTS_REDEMPTION).toBe('none');
  });
});

// ── getBalanceDeltas ──────────────────────────────────────────────────────────

describe('getBalanceDeltas', () => {
  it('returns +amount single delta for INCOME', () => {
    const d = getBalanceDeltas({ type: 'INCOME', amount: 5000, accountId: 'a1' });
    expect(d).toEqual({ kind: 'single', accountId: 'a1', delta: 5000 });
  });

  it('returns -amount single delta for EXPENSE', () => {
    const d = getBalanceDeltas({ type: 'EXPENSE', amount: 200, accountId: 'a1' });
    expect(d).toEqual({ kind: 'single', accountId: 'a1', delta: -200 });
  });

  it('degrades INVESTMENT without a destination account to a plain debit (backward-compat)', () => {
    const d = getBalanceDeltas({ type: 'INVESTMENT', amount: 10000, accountId: 'a1' });
    expect(d).toEqual({ kind: 'single', accountId: 'a1', delta: -10000 });
  });

  it('returns transfer delta for INVESTMENT with a destination account', () => {
    const d = getBalanceDeltas({
      type: 'INVESTMENT',
      amount: 10000,
      accountId: 'bank1',
      toAccountId: 'demat1',
    });
    expect(d).toEqual({ kind: 'transfer', fromId: 'bank1', toId: 'demat1', amount: 10000 });
  });

  it('returns +amount single delta for REFUND', () => {
    const d = getBalanceDeltas({ type: 'REFUND', amount: 150, accountId: 'a1' });
    expect(d).toEqual({ kind: 'single', accountId: 'a1', delta: 150 });
  });

  it('returns transfer delta for TRANSFER with toAccountId', () => {
    const d = getBalanceDeltas({
      type: 'TRANSFER',
      amount: 1000,
      accountId: 'a1',
      toAccountId: 'a2',
    });
    expect(d).toEqual({ kind: 'transfer', fromId: 'a1', toId: 'a2', amount: 1000 });
  });

  it('returns transfer delta for ATM_WITHDRAWAL with toAccountId', () => {
    const d = getBalanceDeltas({
      type: 'ATM_WITHDRAWAL',
      amount: 500,
      accountId: 'a1',
      toAccountId: 'cash',
    });
    expect(d).toEqual({ kind: 'transfer', fromId: 'a1', toId: 'cash', amount: 500 });
  });

  it('degrades TRANSFER without toAccountId to a plain debit', () => {
    const d = getBalanceDeltas({
      type: 'TRANSFER',
      amount: 1000,
      accountId: 'a1',
      toAccountId: null,
    });
    expect(d).toEqual({ kind: 'single', accountId: 'a1', delta: -1000 });
  });

  it('returns none for COUPON_REDEMPTION', () => {
    const d = getBalanceDeltas({ type: 'COUPON_REDEMPTION', amount: 100, accountId: 'a1' });
    expect(d).toEqual({ kind: 'none' });
  });

  it('returns none for POINTS_REDEMPTION', () => {
    const d = getBalanceDeltas({ type: 'POINTS_REDEMPTION', amount: 100, accountId: 'a1' });
    expect(d).toEqual({ kind: 'none' });
  });
});

// ── reverseDeltas ─────────────────────────────────────────────────────────────

describe('reverseDeltas', () => {
  it('negates a single delta', () => {
    const d = reverseDeltas({ kind: 'single', accountId: 'a1', delta: 500 });
    expect(d).toEqual({ kind: 'single', accountId: 'a1', delta: -500 });
  });

  it('negates a negative single delta back to positive', () => {
    const d = reverseDeltas({ kind: 'single', accountId: 'a1', delta: -200 });
    expect(d).toEqual({ kind: 'single', accountId: 'a1', delta: 200 });
  });

  it('swaps fromId and toId for a transfer', () => {
    const d = reverseDeltas({ kind: 'transfer', fromId: 'a1', toId: 'a2', amount: 1000 });
    expect(d).toEqual({ kind: 'transfer', fromId: 'a2', toId: 'a1', amount: 1000 });
  });

  it('is a no-op for none', () => {
    const d = reverseDeltas({ kind: 'none' });
    expect(d).toEqual({ kind: 'none' });
  });

  it('is its own inverse — double-reverse yields the original', () => {
    const original = { kind: 'single' as const, accountId: 'a1', delta: 999 };
    expect(reverseDeltas(reverseDeltas(original))).toEqual(original);

    const transfer = { kind: 'transfer' as const, fromId: 'a1', toId: 'a2', amount: 500 };
    expect(reverseDeltas(reverseDeltas(transfer))).toEqual(transfer);
  });
});

// ── computeLedgerBalance ──────────────────────────────────────────────────────

describe('computeLedgerBalance', () => {
  it('returns openingBalance when no transactions', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([]);
    const balance = await computeLedgerBalance(prisma as never, 'a1', 10000);
    expect(balance).toBe(10000);
  });

  it('adds income transactions', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'INCOME', amount: 5000, accountId: 'a1', toAccountId: null },
    ] as never);
    const balance = await computeLedgerBalance(prisma as never, 'a1', 0);
    expect(balance).toBe(5000);
  });

  it('subtracts expense transactions', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'EXPENSE', amount: 300, accountId: 'a1', toAccountId: null },
    ] as never);
    const balance = await computeLedgerBalance(prisma as never, 'a1', 1000);
    expect(balance).toBe(700);
  });

  it('handles transfer out (source account)', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'TRANSFER', amount: 2000, accountId: 'a1', toAccountId: 'a2' },
    ] as never);
    const balance = await computeLedgerBalance(prisma as never, 'a1', 5000);
    expect(balance).toBe(3000);
  });

  it('handles transfer in (destination account)', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'TRANSFER', amount: 2000, accountId: 'a1', toAccountId: 'a2' },
    ] as never);
    // Computing for 'a2' (the destination)
    const balance = await computeLedgerBalance(prisma as never, 'a2', 0);
    expect(balance).toBe(2000);
  });

  it('subtracts an INVESTMENT with no destination account (old-style, pre-destination-field data)', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'INVESTMENT', amount: 10000, accountId: 'a1', toAccountId: null },
    ] as never);
    const balance = await computeLedgerBalance(prisma as never, 'a1', 50000);
    expect(balance).toBe(40000);
  });

  it('credits the destination account for an INVESTMENT with a destination set', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'INVESTMENT', amount: 10000, accountId: 'bank1', toAccountId: 'demat1' },
    ] as never);
    const sourceBalance = await computeLedgerBalance(prisma as never, 'bank1', 50000);
    expect(sourceBalance).toBe(40000);

    const destBalance = await computeLedgerBalance(prisma as never, 'demat1', 0);
    expect(destBalance).toBe(10000);
  });

  it('ignores COUPON_REDEMPTION (no cash movement)', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'COUPON_REDEMPTION', amount: 50, accountId: 'a1', toAccountId: null },
    ] as never);
    const balance = await computeLedgerBalance(prisma as never, 'a1', 1000);
    expect(balance).toBe(1000);
  });

  it('compounds multiple transactions correctly', async () => {
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'INCOME', amount: 50000, accountId: 'a1', toAccountId: null },
      { type: 'EXPENSE', amount: 3000, accountId: 'a1', toAccountId: null },
      { type: 'TRANSFER', amount: 10000, accountId: 'a1', toAccountId: 'a2' },
      { type: 'REFUND', amount: 500, accountId: 'a1', toAccountId: null },
    ] as never);
    // 0 + 50000 - 3000 - 10000 + 500 = 37500
    const balance = await computeLedgerBalance(prisma as never, 'a1', 0);
    expect(balance).toBe(37500);
  });
});

// ── reconcileAccount ──────────────────────────────────────────────────────────

describe('reconcileAccount', () => {
  it('returns isDrifted=false when stored matches ledger', async () => {
    vi.mocked(prisma.account.findUniqueOrThrow).mockResolvedValue({
      balance: 5000,
      openingBalance: 0,
    } as never);
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'INCOME', amount: 5000, accountId: 'a1', toAccountId: null },
    ] as never);

    const result = await reconcileAccount('a1');
    expect(result.isDrifted).toBe(false);
    expect(result.drift).toBe(0);
    expect(result.storedBalance).toBe(5000);
    expect(result.computedBalance).toBe(5000);
  });

  it('detects positive drift (stored > computed)', async () => {
    vi.mocked(prisma.account.findUniqueOrThrow).mockResolvedValue({
      balance: 10000,
      openingBalance: 0,
    } as never);
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'INCOME', amount: 5000, accountId: 'a1', toAccountId: null },
    ] as never);

    const result = await reconcileAccount('a1');
    expect(result.isDrifted).toBe(true);
    expect(result.drift).toBe(5000);
    expect(result.computedBalance).toBe(5000);
  });

  it('detects negative drift (stored < computed)', async () => {
    vi.mocked(prisma.account.findUniqueOrThrow).mockResolvedValue({
      balance: 0,
      openingBalance: 0,
    } as never);
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'INCOME', amount: 50000, accountId: 'a1', toAccountId: null },
    ] as never);

    const result = await reconcileAccount('a1');
    expect(result.isDrifted).toBe(true);
    expect(result.drift).toBe(-50000);
  });

  it('treats sub-rupee differences as clean (< ₹0.01 threshold)', async () => {
    vi.mocked(prisma.account.findUniqueOrThrow).mockResolvedValue({
      balance: 1000.005,
      openingBalance: 0,
    } as never);
    vi.mocked(prisma.financeTransaction.findMany).mockResolvedValue([
      { type: 'INCOME', amount: 1000, accountId: 'a1', toAccountId: null },
    ] as never);

    const result = await reconcileAccount('a1');
    expect(result.isDrifted).toBe(false);
  });
});
