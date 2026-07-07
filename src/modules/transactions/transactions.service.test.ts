import {
  DuplicateDetectedError,
  NotFoundError,
  TxLockedError,
  ValidationError,
} from '@/lib/api/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionRepository } from './transactions.repository';
import { TransactionService } from './transactions.service';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('./transactions.repository');
vi.mock('@/lib/rules-engine/evaluator', () => ({ evaluateFraud: vi.fn() }));
vi.mock('@/modules/users/users.repository', () => ({
  UserRepository: { findById: vi.fn().mockResolvedValue({ createdAt: new Date() }) },
}));

// Prisma mock: $transaction executes the callback immediately with a mock client.
// Each test can override individual methods on mockPrismaTx as needed.
const mockPrismaTx = {
  financeTransaction: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  account: {
    update: vi.fn().mockResolvedValue({}),
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
    expect(mockPrismaTx.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc1' },
        data: expect.objectContaining({ balance: { increment: 50000 } }),
      }),
    );
  });

  it('decrements account balance for EXPENSE', async () => {
    mockPrismaTx.financeTransaction.create.mockResolvedValue(baseTx);
    await TransactionService.createTransaction({ ...baseDto, type: 'EXPENSE', amount: 500 });
    expect(mockPrismaTx.account.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc1' },
        data: expect.objectContaining({ balance: { increment: -500 } }),
      }),
    );
  });

  it('decrements account balance for INVESTMENT', async () => {
    mockPrismaTx.financeTransaction.create.mockResolvedValue({ ...baseTx, type: 'INVESTMENT' });
    await TransactionService.createTransaction({ ...baseDto, type: 'INVESTMENT', amount: 10000 });
    expect(mockPrismaTx.account.update).toHaveBeenCalledWith(
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
    const calls = mockPrismaTx.account.update.mock.calls;
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
    const calls = mockPrismaTx.account.update.mock.calls;
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
    expect(mockPrismaTx.account.update).not.toHaveBeenCalled();
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

    const updates = mockPrismaTx.account.update.mock.calls;
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

    const updates = mockPrismaTx.account.update.mock.calls;
    expect(updates[0][0]).toMatchObject({ data: { balance: { increment: -5000 } } }); // reverse income
    expect(updates[1][0]).toMatchObject({ data: { balance: { increment: -5000 } } }); // apply expense
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
    expect(mockPrismaTx.account.update).toHaveBeenCalledWith(
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

    const updates = mockPrismaTx.account.update.mock.calls;
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
    expect(mockPrismaTx.account.update).toHaveBeenCalledWith(
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
