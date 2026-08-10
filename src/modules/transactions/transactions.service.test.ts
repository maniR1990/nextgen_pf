import {
  DuplicateDetectedError,
  NotFoundError,
  TxLockedError,
  ValidationError,
} from '@/lib/api/errors';
import { prisma } from '@/lib/db/prisma';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionRepository } from './transactions.repository';
import { TransactionService } from './transactions.service';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./transactions.repository');

// Prisma mock: $transaction executes the callback immediately with a mock client.
// Each test can override individual methods on mockPrismaTx as needed.
const mockPrismaTx = {
  financeTransaction: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  account: {
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
  },
};

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(mockPrismaTx)),
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const baseTx = {
  id: 'tx1',
  userId: 'u1',
  type: 'EXPENSE',
  amount: 500,
  accountId: 'acc1',
  toAccountId: null,
  status: 'PENDING',
  merchant: 'BigBasket',
  reconciledAt: null,
  voidedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const incomeTx = { ...baseTx, type: 'INCOME', amount: 50000 };
const transferTx = { ...baseTx, type: 'TRANSFER', accountId: 'acc1', toAccountId: 'acc2' };

beforeEach(() => vi.clearAllMocks());

// ── getPeriodSummary ─────────────────────────────────────────────────────────

describe('TransactionService.getPeriodSummary', () => {
  it('delegates to the shared period-spend calculation', async () => {
    vi.mocked(TransactionRepository.sumByTypeForPeriod).mockResolvedValue([
      { type: 'EXPENSE', _sum: { amount: 24399.68 } },
      { type: 'INCOME', _sum: { amount: 85000 } },
    ] as never);
    vi.mocked(TransactionRepository.sumUncategorizedByTypeForPeriod).mockResolvedValue(
      [] as never,
    );

    const result = await TransactionService.getPeriodSummary('u1', 2026, 7);

    expect(result).toEqual({
      totalIncome: 85000,
      totalExpense: 24399.68,
      totalInvestment: 0,
      net: 85000 - 24399.68,
    });
  });

  it('separates Investment and Sinking Deposit into totalInvestment, out of totalExpense', async () => {
    vi.mocked(TransactionRepository.sumByTypeForPeriod).mockResolvedValue([
      { type: 'EXPENSE', _sum: { amount: 5000 } },
      { type: 'INVESTMENT', _sum: { amount: 23000 } },
      { type: 'SINKING_DEPOSIT', _sum: { amount: 2000 } },
      { type: 'INCOME', _sum: { amount: 42000 } },
    ] as never);
    vi.mocked(TransactionRepository.sumUncategorizedByTypeForPeriod).mockResolvedValue(
      [] as never,
    );

    const result = await TransactionService.getPeriodSummary('u1', 2026, 7);

    expect(result).toEqual({
      totalIncome: 42000,
      totalExpense: 5000,
      totalInvestment: 25000,
      net: 42000 - (5000 + 23000 + 2000),
    });
  });
});

// ── getById ───────────────────────────────────────────────────────────────────

describe('TransactionService.getById', () => {
  it('returns the transaction for the owning user', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(baseTx as never);
    expect(await TransactionService.getById('tx1', 'u1')).toMatchObject({ id: 'tx1' });
  });

  it('throws NotFoundError when tx belongs to another user', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...baseTx,
      userId: 'other',
    } as never);
    await expect(TransactionService.getById('tx1', 'u1')).rejects.toThrow(NotFoundError);
  });
});

// ── createTransaction — balance deltas ────────────────────────────────────────

describe('TransactionService.createTransaction — balance', () => {
  const baseDto = {
    userId: 'u1',
    date: '2026-07-01',
    budgetPeriodYear: 2026,
    budgetPeriodMonth: 7,
    paymentSourceId: 'acc1',
    paymentMethod: 'UPI',
  } as const;

  it('increments account balance for INCOME', async () => {
    mockPrismaTx.financeTransaction.create.mockResolvedValue(incomeTx);
    await TransactionService.createTransaction({ ...baseDto, type: 'INCOME', amount: 50000 });
    expect(mockPrismaTx.account.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc1' },
        data: expect.objectContaining({ balance: { increment: 50000 } }),
      }),
    );
  });

  it('decrements account balance for EXPENSE', async () => {
    mockPrismaTx.financeTransaction.create.mockResolvedValue(baseTx);
    await TransactionService.createTransaction({ ...baseDto, type: 'EXPENSE', amount: 500 });
    expect(mockPrismaTx.account.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc1' },
        data: expect.objectContaining({ balance: { increment: -500 } }),
      }),
    );
  });

  it('decrements account balance for INVESTMENT', async () => {
    mockPrismaTx.financeTransaction.create.mockResolvedValue({ ...baseTx, type: 'INVESTMENT' });
    await TransactionService.createTransaction({ ...baseDto, type: 'INVESTMENT', amount: 10000 });
    expect(mockPrismaTx.account.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ balance: { increment: -10000 } }),
      }),
    );
  });

  it('updates both accounts for TRANSFER', async () => {
    mockPrismaTx.financeTransaction.create.mockResolvedValue(transferTx);
    await TransactionService.createTransaction({
      ...baseDto,
      type: 'TRANSFER',
      amount: 2000,
      toAccountId: 'acc2',
    });
    const calls = mockPrismaTx.account.updateMany.mock.calls;
    const fromCall = calls.find(
      (c: unknown[]) => (c[0] as { where: { id: string } }).where.id === 'acc1',
    );
    const toCall = calls.find(
      (c: unknown[]) => (c[0] as { where: { id: string } }).where.id === 'acc2',
    );
    expect(fromCall?.[0]).toMatchObject({ data: { balance: { decrement: 2000 } } });
    expect(toCall?.[0]).toMatchObject({ data: { balance: { increment: 2000 } } });
  });

  it('credits the destination account for an INVESTMENT with toAccountId set', async () => {
    mockPrismaTx.financeTransaction.create.mockResolvedValue({
      ...baseTx,
      type: 'INVESTMENT',
      toAccountId: 'demat1',
    });
    await TransactionService.createTransaction({
      ...baseDto,
      type: 'INVESTMENT',
      amount: 10000,
      toAccountId: 'demat1',
    });
    const calls = mockPrismaTx.account.updateMany.mock.calls;
    const fromCall = calls.find(
      (c: unknown[]) => (c[0] as { where: { id: string } }).where.id === 'acc1',
    );
    const toCall = calls.find(
      (c: unknown[]) => (c[0] as { where: { id: string } }).where.id === 'demat1',
    );
    expect(fromCall?.[0]).toMatchObject({ data: { balance: { decrement: 10000 } } });
    expect(toCall?.[0]).toMatchObject({ data: { balance: { increment: 10000 } } });
  });

  it('does NOT touch account balance for COUPON_REDEMPTION', async () => {
    mockPrismaTx.financeTransaction.create.mockResolvedValue({
      ...baseTx,
      type: 'COUPON_REDEMPTION',
    });
    await TransactionService.createTransaction({
      ...baseDto,
      type: 'COUPON_REDEMPTION',
      amount: 50,
    });
    expect(mockPrismaTx.account.updateMany).not.toHaveBeenCalled();
  });

  it('throws ValidationError when fundGroupId set on EXPENSE', async () => {
    await expect(
      TransactionService.createTransaction({
        ...baseDto,
        type: 'EXPENSE',
        amount: 500,
        fundGroupId: 'fg1',
        fundGroupFlow: 'IN',
      }),
    ).rejects.toThrow(ValidationError);
  });
});

// ── createBulk — one bill, many items ───────────────────────────────────────

describe('TransactionService.createBulk', () => {
  const bulkDto = {
    userId: 'u1',
    type: 'EXPENSE' as const,
    merchant: 'Sri Ganesh Grocers',
    date: '2026-07-19',
    budgetPeriodYear: 2026,
    budgetPeriodMonth: 7,
    paymentSourceId: 'acc1',
    paymentMethod: 'UPI',
    items: [
      { categoryId: 'meat', amount: 805 },
      { categoryId: 'milk', amount: 384 },
      { categoryId: 'butter', amount: 140 },
    ],
  };

  beforeEach(() => {
    let seq = 0;
    mockPrismaTx.financeTransaction.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        seq += 1;
        return Promise.resolve({ id: `tx${seq}`, ...data });
      },
    );
  });

  it('creates exactly one row per item inside a single $transaction call', async () => {
    await TransactionService.createBulk(bulkDto);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrismaTx.financeTransaction.create).toHaveBeenCalledTimes(3);
  });

  it('stamps the same billBatchId on every created row', async () => {
    const created = await TransactionService.createBulk(bulkDto);
    const batchIds = created.map((row: { billBatchId: string }) => row.billBatchId);
    expect(new Set(batchIds).size).toBe(1);
    expect(batchIds[0]).toBeTruthy();
  });

  it('applies one combined balance delta for the whole batch, not one per item', async () => {
    await TransactionService.createBulk(bulkDto);
    // Batched, not per-item — see the comment on createBulk: N separate round-trips
    // multiplied how long the interactive transaction stayed open for no benefit,
    // since every item already shares the same account. Net effect is identical.
    expect(mockPrismaTx.account.updateMany).toHaveBeenCalledTimes(1);
    const [[{ data }]] = mockPrismaTx.account.updateMany.mock.calls as [
      [{ data: { balance: { increment: number } } }],
    ];
    expect(data.balance.increment).toBe(-(805 + 384 + 140));
  });

  it('stores the exact client key only on the first (anchor) row', async () => {
    const created = await TransactionService.createBulk({
      ...bulkDto,
      idempotencyKey: 'key-1',
    });
    expect(created[0].idempotencyKey).toBe('key-1');
    expect(created[1].idempotencyKey).not.toBe('key-1');
    expect(created[2].idempotencyKey).not.toBe('key-1');
  });

  it('never omits idempotencyKey on any row — a missing field is treated as null by Mongo\'s unique index and would collide across rows', async () => {
    const created = await TransactionService.createBulk({ ...bulkDto, idempotencyKey: 'key-1' });
    for (const row of created as Array<{ idempotencyKey: unknown }>) {
      expect(row.idempotencyKey).toBeTruthy();
    }
  });

  it('gives every row a distinct idempotencyKey even without a client-supplied key', async () => {
    const created = await TransactionService.createBulk(bulkDto);
    const keys = (created as Array<{ idempotencyKey: string }>).map((r) => r.idempotencyKey);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.every(Boolean)).toBe(true);
  });

  it('replays the existing batch instead of creating again when the idempotency key was already used within 10 minutes', async () => {
    vi.mocked(TransactionRepository.findByIdempotencyKey).mockResolvedValue({
      id: 'tx1',
      billBatchId: 'batch-1',
      createdAt: new Date(),
    } as never);
    vi.mocked(TransactionRepository.findByBatchId).mockResolvedValue([
      { id: 'tx1' },
      { id: 'tx2' },
      { id: 'tx3' },
    ] as never);

    const result = await TransactionService.createBulk({ ...bulkDto, idempotencyKey: 'key-1' });

    expect(result).toHaveLength(3);
    expect(mockPrismaTx.financeTransaction.create).not.toHaveBeenCalled();
  });

  it('creates a fresh batch when a matching idempotency key exists but is older than 10 minutes', async () => {
    vi.mocked(TransactionRepository.findByIdempotencyKey).mockResolvedValue({
      id: 'tx1',
      billBatchId: 'batch-1',
      createdAt: new Date(Date.now() - 700_000),
    } as never);

    await TransactionService.createBulk({ ...bulkDto, idempotencyKey: 'key-1' });

    expect(mockPrismaTx.financeTransaction.create).toHaveBeenCalledTimes(3);
  });

  it('uses each item categoryId and amount, and the shared merchant/date/account for every row', async () => {
    const created = await TransactionService.createBulk(bulkDto);
    for (const row of created as Array<Record<string, unknown>>) {
      expect(row.merchant).toBe('Sri Ganesh Grocers');
      expect((row.account as { connect: { id: string } }).connect.id).toBe('acc1');
    }
    expect((created[0].category as { connect: { id: string } }).connect.id).toBe('meat');
    expect(created[0].amount).toBe(805);
    expect((created[1].category as { connect: { id: string } }).connect.id).toBe('milk');
    expect(created[1].amount).toBe(384);
  });
});

// ── createBulk — SINKING_DEPOSIT (fund several budgeted bills at once) ────────

describe('TransactionService.createBulk — SINKING_DEPOSIT', () => {
  const sinkingBulkDto = {
    userId: 'u1',
    type: 'SINKING_DEPOSIT' as const,
    date: '2026-08-10',
    budgetPeriodYear: 2026,
    budgetPeriodMonth: 8,
    paymentSourceId: 'acc1',
    toAccountId: 'acc2',
    paymentMethod: 'UPI',
    items: [
      { categoryId: 'electricity', amount: 5000 },
      { categoryId: 'internet', amount: 1000 },
    ],
  };

  beforeEach(() => {
    let seq = 0;
    mockPrismaTx.financeTransaction.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => {
        seq += 1;
        return Promise.resolve({ id: `tx${seq}`, ...data });
      },
    );
  });

  it('connects each row to the shared toAccountId', async () => {
    const created = await TransactionService.createBulk(sinkingBulkDto);
    for (const row of created as Array<Record<string, unknown>>) {
      expect((row.toAccount as { connect: { id: string } }).connect.id).toBe('acc2');
    }
  });

  it('debits the source and credits the destination once for the whole batch, not per item', async () => {
    await TransactionService.createBulk(sinkingBulkDto);
    // One combined transfer delta, not one per item — see the comment on createBulk:
    // this is exactly what fixed the real timeout hit on an 8-item batch in prod
    // (2 items x up to 2 balance calls each was already enough to blow the interactive
    // transaction's budget under cross-region latency).
    expect(mockPrismaTx.account.updateMany).toHaveBeenCalledTimes(2); // 1 debit + 1 credit
    const calls = mockPrismaTx.account.updateMany.mock.calls as Array<
      [{ where: { id: string }; data: { balance: { increment?: number; decrement?: number } } }]
    >;
    const bySource = calls.find((c) => c[0].where.id === 'acc1');
    const byDest = calls.find((c) => c[0].where.id === 'acc2');
    expect(bySource?.[0].data.balance.decrement).toBe(6000);
    expect(byDest?.[0].data.balance.increment).toBe(6000);
  });

  it('connects an optional fundId with fundFlow IN on every row', async () => {
    const created = await TransactionService.createBulk({ ...sinkingBulkDto, fundId: 'fund1' });
    for (const row of created as Array<Record<string, unknown>>) {
      expect((row.fund as { connect: { id: string } }).connect.id).toBe('fund1');
      expect(row.fundFlow).toBe('IN');
    }
  });

  it('omits the fund relation entirely when no fundId is given', async () => {
    const created = await TransactionService.createBulk(sinkingBulkDto);
    for (const row of created as Array<Record<string, unknown>>) {
      expect(row.fund).toBeUndefined();
    }
  });
});

// ── patch — balance recalculation ─────────────────────────────────────────────

describe('TransactionService.patch — balance', () => {
  it('reverses old delta and applies new delta on amount change', async () => {
    // Existing: INCOME ₹1000 → stored balance was +1000
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...incomeTx,
      amount: 1000,
    } as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue({ ...incomeTx, amount: 1500 });

    await TransactionService.patch('tx1', 'u1', { amount: 1500 });

    const updates = mockPrismaTx.account.updateMany.mock.calls;
    // First call: reverse old (+1000 → -1000)
    expect(updates[0][0]).toMatchObject({ data: { balance: { increment: -1000 } } });
    // Second call: apply new (+1500)
    expect(updates[1][0]).toMatchObject({ data: { balance: { increment: 1500 } } });
  });

  it('reverses old delta and applies new delta on type change (INCOME → EXPENSE)', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...incomeTx,
      amount: 5000,
    } as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue({
      ...incomeTx,
      type: 'EXPENSE',
      amount: 5000,
    });

    await TransactionService.patch('tx1', 'u1', { type: 'EXPENSE' });

    const updates = mockPrismaTx.account.updateMany.mock.calls;
    expect(updates[0][0]).toMatchObject({ data: { balance: { increment: -5000 } } }); // reverse income
    expect(updates[1][0]).toMatchObject({ data: { balance: { increment: -5000 } } }); // apply expense
  });

  // Regression: an Investment -> Sinking Deposit edit (or any type change between two
  // transfer-shaped types) reverses the OLD delta before applying the new one. If the
  // old transaction's toAccountId points at an account that's since been archived or
  // deleted, `account.update` would throw P2025 RecordNotFound over a balance-reversal
  // step that has no account left to reverse — failing the entire edit. updateMany
  // matching zero rows is a safe no-op instead, so the edit still goes through.
  it('does not throw when the old delta references an account that no longer exists', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...baseTx,
      type: 'INVESTMENT',
      amount: 8000,
      accountId: 'bank1',
      toAccountId: 'deleted-demat-account',
    } as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue({
      ...baseTx,
      type: 'SINKING_DEPOSIT',
    });
    // Simulates the stale account: no document matches, so Mongo/Prisma reports 0
    // rows touched instead of throwing.
    mockPrismaTx.account.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      TransactionService.patch('tx1', 'u1', {
        type: 'SINKING_DEPOSIT',
        toAccountId: 'goalwallet1',
      }),
    ).resolves.toBeDefined();
  });

  it('throws TxLockedError on a reconciled transaction', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...baseTx,
      reconciledAt: new Date(),
    } as never);
    await expect(TransactionService.patch('tx1', 'u1', { notes: 'x' })).rejects.toThrow(
      TxLockedError,
    );
  });

  it('throws NotFoundError for unknown id', async () => {
    vi.mocked(TransactionRepository.findById).mockRejectedValue(new NotFoundError());
    await expect(TransactionService.patch('bad', 'u1', {})).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError when fundGroupId set on EXPENSE transaction', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...baseTx,
      type: 'EXPENSE',
    } as never);
    await expect(
      TransactionService.patch('tx1', 'u1', { fundGroupId: 'fg1', fundGroupFlow: 'IN' }),
    ).rejects.toThrow(ValidationError);
  });
});

// Regression: switching a transaction's Investment/Sinking destination clears the
// field that no longer applies (categoryId, toAccountId, fundId) by sending it as ''
// rather than omitting it — an unconditional `connect: { id: dto.categoryId } }` would
// try to connect an empty-string ObjectId and throw. Same shape as the pre-existing
// fundId handling; categoryId/toAccountId needed the same disconnect-on-empty guard.
describe('TransactionService.patch — clearing a relation with an empty string', () => {
  it('disconnects category instead of connecting an empty id', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(baseTx as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue(baseTx);

    await TransactionService.patch('tx1', 'u1', { categoryId: '' });

    const call = mockPrismaTx.financeTransaction.update.mock.calls[0][0];
    expect(call.data.category).toEqual({ disconnect: true });
  });

  it('still connects category normally when a real id is sent', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(baseTx as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue(baseTx);

    await TransactionService.patch('tx1', 'u1', { categoryId: 'cat1' });

    const call = mockPrismaTx.financeTransaction.update.mock.calls[0][0];
    expect(call.data.category).toEqual({ connect: { id: 'cat1' } });
  });

  it('disconnects toAccount instead of connecting an empty id', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(baseTx as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue(baseTx);

    await TransactionService.patch('tx1', 'u1', { toAccountId: '' });

    const call = mockPrismaTx.financeTransaction.update.mock.calls[0][0];
    expect(call.data.toAccount).toEqual({ disconnect: true });
  });

  it('still connects toAccount normally when a real id is sent', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(baseTx as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue(baseTx);

    await TransactionService.patch('tx1', 'u1', { toAccountId: 'acc2' });

    const call = mockPrismaTx.financeTransaction.update.mock.calls[0][0];
    expect(call.data.toAccount).toEqual({ connect: { id: 'acc2' } });
  });

  it('leaves category/toAccount untouched when the fields are omitted entirely', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(baseTx as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue(baseTx);

    await TransactionService.patch('tx1', 'u1', { notes: 'unrelated edit' });

    const call = mockPrismaTx.financeTransaction.update.mock.calls[0][0];
    expect(call.data.category).toBeUndefined();
    expect(call.data.toAccount).toBeUndefined();
  });
});

// ── voidTransaction ────────────────────────────────────────────────────────────

describe('TransactionService.voidTransaction', () => {
  it('voids the transaction and reverses the balance delta', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(incomeTx as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue({
      ...incomeTx,
      status: 'VOID',
      voidedAt: new Date(),
    });

    const result = await TransactionService.voidTransaction('tx1', 'u1');

    expect(result.status).toBe('VOID');
    // INCOME ₹50000 reversal → decrement 50000
    expect(mockPrismaTx.account.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ balance: { increment: -50000 } }),
      }),
    );
  });

  it('reverses both sides of a TRANSFER on void', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...transferTx,
      amount: 3000,
    } as never);
    mockPrismaTx.financeTransaction.update.mockResolvedValue({ ...transferTx, status: 'VOID' });

    await TransactionService.voidTransaction('tx1', 'u1');

    const updates = mockPrismaTx.account.updateMany.mock.calls;
    const acc1Call = updates.find(
      (c: unknown[]) => (c[0] as { where: { id: string } }).where.id === 'acc1',
    );
    const acc2Call = updates.find(
      (c: unknown[]) => (c[0] as { where: { id: string } }).where.id === 'acc2',
    );
    // Reverse: acc1 gets back +3000, acc2 loses -3000
    expect(acc1Call?.[0]).toMatchObject({ data: { balance: { increment: 3000 } } });
    expect(acc2Call?.[0]).toMatchObject({ data: { balance: { decrement: 3000 } } });
  });

  it('throws TxLockedError when already reconciled', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...baseTx,
      reconciledAt: new Date(),
    } as never);
    await expect(TransactionService.voidTransaction('tx1', 'u1')).rejects.toThrow(TxLockedError);
  });
});

// ── hardDelete ────────────────────────────────────────────────────────────────

describe('TransactionService.hardDelete', () => {
  it('deletes the record and reverses the balance delta', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(baseTx as never);
    mockPrismaTx.financeTransaction.delete.mockResolvedValue(baseTx);

    await TransactionService.hardDelete('tx1', 'u1');

    expect(mockPrismaTx.financeTransaction.delete).toHaveBeenCalledWith({ where: { id: 'tx1' } });
    // EXPENSE ₹500 reversal → increment 500
    expect(mockPrismaTx.account.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ balance: { increment: 500 } }),
      }),
    );
  });

  it('throws TxLockedError on reconciled rows', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...baseTx,
      reconciledAt: new Date(),
    } as never);
    await expect(TransactionService.hardDelete('tx1', 'u1')).rejects.toThrow(TxLockedError);
  });

  it('throws NotFoundError for unknown user', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...baseTx,
      userId: 'other',
    } as never);
    await expect(TransactionService.hardDelete('tx1', 'u1')).rejects.toThrow(NotFoundError);
  });
});

// ── checkDuplicates ───────────────────────────────────────────────────────────

describe('TransactionService.checkDuplicates', () => {
  it('throws DuplicateDetectedError when duplicate exists', async () => {
    vi.mocked(TransactionRepository.findDuplicates).mockResolvedValue([{ id: 'dup1' }] as never);
    await expect(
      TransactionService.checkDuplicatesV1('u1', 'BigBasket', 500, '2024-06-12'),
    ).rejects.toThrow(DuplicateDetectedError);
  });

  it('returns null when no duplicate', async () => {
    vi.mocked(TransactionRepository.findDuplicates).mockResolvedValue([]);
    expect(
      await TransactionService.checkDuplicatesV1('u1', 'BigBasket', 500, '2024-06-12'),
    ).toBeNull();
  });
});

// ── listWithCursor ────────────────────────────────────────────────────────────

describe('TransactionService.listWithCursor', () => {
  it('returns rows and nextCursor when more data exists', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({ ...baseTx, id: `tx${i}` }));
    vi.mocked(TransactionRepository.findWithCursor).mockResolvedValue(rows as never);
    const result = await TransactionService.listWithCursor({ userId: 'u1', limit: 20 });
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('tx19');
    expect(result.rows).toHaveLength(20);
  });

  it('returns hasMore=false when at end of results', async () => {
    vi.mocked(TransactionRepository.findWithCursor).mockResolvedValue([baseTx] as never);
    const result = await TransactionService.listWithCursor({ userId: 'u1', limit: 20 });
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('passes budget period and sort to repository', async () => {
    vi.mocked(TransactionRepository.findWithCursor).mockResolvedValue([]);
    await TransactionService.listWithCursor({
      userId: 'u1',
      budgetPeriodYear: 2026,
      budgetPeriodMonth: 7,
      sort: 'date_asc',
      types: ['TRANSFER', 'ATM_WITHDRAWAL'],
    });
    expect(TransactionRepository.findWithCursor).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        budgetPeriodYear: 2026,
        budgetPeriodMonth: 7,
        sort: 'date_asc',
        types: ['TRANSFER', 'ATM_WITHDRAWAL'],
      }),
    );
  });
});

// ── fund group tagging ────────────────────────────────────────────────────────

describe('TransactionService.patch — fund group tagging', () => {
  it.each(['TRANSFER', 'INVESTMENT', 'SINKING_DEPOSIT'])(
    'persists fundGroupId + fundGroupFlow when type=%s',
    async (txType) => {
      vi.mocked(TransactionRepository.findById).mockResolvedValue({
        ...baseTx,
        type: txType,
      } as never);
      mockPrismaTx.financeTransaction.update.mockResolvedValue({
        ...baseTx,
        fundGroupId: 'fg1',
        fundGroupFlow: 'IN',
      });
      await TransactionService.patch('tx1', 'u1', { fundGroupId: 'fg1', fundGroupFlow: 'IN' });
      expect(mockPrismaTx.financeTransaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ fundGroupId: 'fg1', fundGroupFlow: 'IN' }),
        }),
      );
    },
  );

  it('throws ValidationError when fundGroupId provided without fundGroupFlow', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...baseTx,
      type: 'TRANSFER',
    } as never);
    await expect(TransactionService.patch('tx1', 'u1', { fundGroupId: 'fg1' })).rejects.toThrow(
      ValidationError,
    );
  });
});
