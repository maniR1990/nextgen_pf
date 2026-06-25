import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService } from './transactions.service';
import { TransactionRepository } from './transactions.repository';
import { DuplicateDetectedError, TxLockedError, NotFoundError, ValidationError } from '@/lib/api/errors';

vi.mock('./transactions.repository');
vi.mock('@/lib/rules-engine/evaluator', () => ({ evaluateFraud: vi.fn() }));
vi.mock('@/modules/users/users.repository', () => ({
  UserRepository: { findById: vi.fn().mockResolvedValue({ createdAt: new Date() }) },
}));

const mockTx = {
  id: 'tx1',
  userId: 'u1',
  status: 'PENDING',
  merchant: 'BigBasket',
  amount: 500,
  reconciledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

// ── getById ──────────────────────────────────────────────────────────────────

describe('TransactionService.getById', () => {
  it('returns the transaction for the owning user', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(mockTx as never);
    const result = await TransactionService.getById('tx1', 'u1');
    expect(result).toMatchObject({ id: 'tx1' });
  });

  it('throws NotFoundError when tx belongs to another user', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({ ...mockTx, userId: 'other' } as never);
    await expect(TransactionService.getById('tx1', 'u1')).rejects.toThrow(NotFoundError);
  });
});

// ── patch ────────────────────────────────────────────────────────────────────

describe('TransactionService.patch', () => {
  it('updates allowed fields', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(mockTx as never);
    vi.mocked(TransactionRepository.update).mockResolvedValue({ ...mockTx, notes: 'edited' } as never);
    const result = await TransactionService.patch('tx1', 'u1', { notes: 'edited' });
    expect(result).toMatchObject({ notes: 'edited' });
  });

  it('throws TxLockedError on a reconciled transaction', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...mockTx,
      reconciledAt: new Date(),
    } as never);
    await expect(TransactionService.patch('tx1', 'u1', { notes: 'x' })).rejects.toThrow(TxLockedError);
  });

  it('throws NotFoundError for unknown id', async () => {
    vi.mocked(TransactionRepository.findById).mockRejectedValue(new NotFoundError());
    await expect(TransactionService.patch('bad', 'u1', {})).rejects.toThrow(NotFoundError);
  });
});

// ── voidTransaction ──────────────────────────────────────────────────────────

describe('TransactionService.voidTransaction', () => {
  it('voids a PENDING transaction', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(mockTx as never);
    vi.mocked(TransactionRepository.void).mockResolvedValue({ ...mockTx, status: 'VOID', voidedAt: new Date() } as never);
    const result = await TransactionService.voidTransaction('tx1', 'u1');
    expect(result.status).toBe('VOID');
  });

  it('throws TxLockedError when already reconciled', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...mockTx,
      reconciledAt: new Date(),
    } as never);
    await expect(TransactionService.voidTransaction('tx1', 'u1')).rejects.toThrow(TxLockedError);
  });
});

// ── hardDelete ───────────────────────────────────────────────────────────────

describe('TransactionService.hardDelete', () => {
  it('deletes an owned transaction', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue(mockTx as never);
    vi.mocked(TransactionRepository.hardDelete).mockResolvedValue(mockTx as never);
    await expect(TransactionService.hardDelete('tx1', 'u1')).resolves.toBeUndefined();
  });

  it('throws TxLockedError on reconciled rows', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...mockTx,
      reconciledAt: new Date(),
    } as never);
    await expect(TransactionService.hardDelete('tx1', 'u1')).rejects.toThrow(TxLockedError);
  });
});

// ── checkDuplicates ──────────────────────────────────────────────────────────

describe('TransactionService.checkDuplicates', () => {
  it('returns DuplicateDetectedError when duplicate exists', async () => {
    vi.mocked(TransactionRepository.findDuplicates).mockResolvedValue([{ id: 'dup1' }] as never);
    await expect(
      TransactionService.checkDuplicatesV1('u1', 'BigBasket', 500, '2024-06-12'),
    ).rejects.toThrow(DuplicateDetectedError);
  });

  it('returns null when no duplicate', async () => {
    vi.mocked(TransactionRepository.findDuplicates).mockResolvedValue([]);
    const result = await TransactionService.checkDuplicatesV1('u1', 'BigBasket', 500, '2024-06-12');
    expect(result).toBeNull();
  });
});

// ── fund group tagging — patch ───────────────────────────────────────────────

const FUND_ALLOWED_TYPES = ['TRANSFER', 'INVESTMENT', 'SINKING_DEPOSIT'];

describe('TransactionService.patch — fund group tagging', () => {
  it.each(FUND_ALLOWED_TYPES)(
    'persists fundGroupId + fundGroupFlow when type=%s',
    async (txType) => {
      vi.mocked(TransactionRepository.findById).mockResolvedValue({
        ...mockTx,
        type: txType,
      } as never);
      vi.mocked(TransactionRepository.update).mockResolvedValue({
        ...mockTx,
        fundGroupId: 'fg1',
        fundGroupFlow: 'IN',
      } as never);

      await TransactionService.patch('tx1', 'u1', {
        fundGroupId: 'fg1',
        fundGroupFlow: 'IN',
      });

      expect(TransactionRepository.update).toHaveBeenCalledWith(
        'tx1',
        expect.objectContaining({ fundGroupId: 'fg1', fundGroupFlow: 'IN' }),
      );
    },
  );

  it('throws ValidationError when fundGroupId set on EXPENSE transaction', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...mockTx,
      type: 'EXPENSE',
    } as never);

    await expect(
      TransactionService.patch('tx1', 'u1', { fundGroupId: 'fg1', fundGroupFlow: 'IN' }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when fundGroupId provided without fundGroupFlow', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...mockTx,
      type: 'TRANSFER',
    } as never);

    await expect(
      TransactionService.patch('tx1', 'u1', { fundGroupId: 'fg1' }),
    ).rejects.toThrow(ValidationError);
  });

  it('allows clearing fundGroupId by passing null for both fields', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...mockTx,
      type: 'TRANSFER',
      fundGroupId: 'fg1',
    } as never);
    vi.mocked(TransactionRepository.update).mockResolvedValue({
      ...mockTx,
      fundGroupId: null,
      fundGroupFlow: null,
    } as never);

    await TransactionService.patch('tx1', 'u1', { fundGroupId: null, fundGroupFlow: null });

    expect(TransactionRepository.update).toHaveBeenCalledWith(
      'tx1',
      expect.objectContaining({ fundGroupId: null, fundGroupFlow: null }),
    );
  });

  it('accepts OUT flow for a fund withdrawal', async () => {
    vi.mocked(TransactionRepository.findById).mockResolvedValue({
      ...mockTx,
      type: 'TRANSFER',
    } as never);
    vi.mocked(TransactionRepository.update).mockResolvedValue({
      ...mockTx,
      fundGroupId: 'fg1',
      fundGroupFlow: 'OUT',
    } as never);

    await TransactionService.patch('tx1', 'u1', {
      fundGroupId: 'fg1',
      fundGroupFlow: 'OUT',
    });

    expect(TransactionRepository.update).toHaveBeenCalledWith(
      'tx1',
      expect.objectContaining({ fundGroupFlow: 'OUT' }),
    );
  });
});

// ── fund group tagging — createTransaction ────────────────────────────────────

describe('TransactionService.createTransaction — fund group tagging', () => {
  it('passes fundGroupId + fundGroupFlow to repository for TRANSFER type', async () => {
    vi.mocked(TransactionRepository.create).mockResolvedValue({
      ...mockTx,
      fundGroupId: 'fg1',
      fundGroupFlow: 'IN',
    } as never);

    await TransactionService.createTransaction({
      userId: 'u1',
      type: 'TRANSFER',
      date: '2026-06-01',
      amount: 10000,
      budgetPeriodYear: 2026,
      budgetPeriodMonth: 6,
      paymentSourceId: 'acc1',
      toAccountId: 'acc2',
      paymentMethod: 'TRANSFER',
      fundGroupId: 'fg1',
      fundGroupFlow: 'IN',
    });

    expect(TransactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ fundGroupId: 'fg1', fundGroupFlow: 'IN' }),
    );
  });

  it('throws ValidationError when fundGroupId set on EXPENSE creation', async () => {
    await expect(
      TransactionService.createTransaction({
        userId: 'u1',
        type: 'EXPENSE',
        date: '2026-06-01',
        amount: 500,
        budgetPeriodYear: 2026,
        budgetPeriodMonth: 6,
        paymentSourceId: 'acc1',
        paymentMethod: 'UPI',
        fundGroupId: 'fg1',
        fundGroupFlow: 'IN',
      }),
    ).rejects.toThrow(ValidationError);
  });

  it('creates transaction without fundGroupId when not provided', async () => {
    vi.mocked(TransactionRepository.create).mockResolvedValue(mockTx as never);

    await TransactionService.createTransaction({
      userId: 'u1',
      type: 'TRANSFER',
      date: '2026-06-01',
      amount: 10000,
      budgetPeriodYear: 2026,
      budgetPeriodMonth: 6,
      paymentSourceId: 'acc1',
      paymentMethod: 'TRANSFER',
    });

    const call = vi.mocked(TransactionRepository.create).mock.calls[0][0] as Record<string, unknown>;
    expect(call).not.toHaveProperty('fundGroupId');
  });
});

// ── listWithCursor ───────────────────────────────────────────────────────────

describe('TransactionService.listWithCursor', () => {
  it('returns rows and nextCursor when more data exists', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({ ...mockTx, id: `tx${i}` }));
    vi.mocked(TransactionRepository.findWithCursor).mockResolvedValue(rows as never);
    const result = await TransactionService.listWithCursor({ userId: 'u1', limit: 20 });
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('tx19');
    expect(result.rows).toHaveLength(20);
  });

  it('returns hasMore=false when at end of results', async () => {
    const rows = [mockTx];
    vi.mocked(TransactionRepository.findWithCursor).mockResolvedValue(rows as never);
    const result = await TransactionService.listWithCursor({ userId: 'u1', limit: 20 });
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('passes budget period and sort to repository', async () => {
    vi.mocked(TransactionRepository.findWithCursor).mockResolvedValue([] as never);
    await TransactionService.listWithCursor({
      userId: 'u1',
      budgetPeriodYear: 2026,
      budgetPeriodMonth: 6,
      sort: 'date_asc',
      types: ['TRANSFER', 'ATM_WITHDRAWAL'],
    });
    expect(TransactionRepository.findWithCursor).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({
        budgetPeriodYear: 2026,
        budgetPeriodMonth: 6,
        sort: 'date_asc',
        types: ['TRANSFER', 'ATM_WITHDRAWAL'],
      }),
    );
  });
});
