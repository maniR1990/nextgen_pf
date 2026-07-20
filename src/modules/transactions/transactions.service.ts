import {
  DuplicateDetectedError,
  ForbiddenError,
  NotFoundError,
  TxLockedError,
  ValidationError,
} from '@/lib/api/errors';
import { applyDeltas, getBalanceDeltas, reverseDeltas } from '@/lib/balance-engine';
import { prisma } from '@/lib/db/prisma';
import { evaluateFraud } from '@/lib/rules-engine/evaluator';
import { UserRepository } from '@/modules/users/users.repository';
import { getPeriodTotals } from './period-spend';
import { TX_INCLUDE, TransactionRepository } from './transactions.repository';
import type {
  BulkCreateTransactionDto,
  CreateTransactionDto,
  GetTransactionsQuery,
  ListWithCursorQuery,
  PatchTransactionDto,
} from './transactions.types';

const FUND_ALLOWED_TYPES = new Set(['TRANSFER', 'INVESTMENT', 'SINKING_DEPOSIT']);

// ── Guards ────────────────────────────────────────────────────────────────

function assertOwned(tx: { userId: string }, userId: string) {
  if (tx.userId !== userId) throw new NotFoundError('Transaction not found');
}

function assertNotLocked(tx: { reconciledAt: Date | null }) {
  if (tx.reconciledAt) throw new TxLockedError();
}

function validateFundGroupTag(
  type: string,
  fundGroupId: string | null | undefined,
  fundGroupFlow: string | null | undefined,
) {
  if (fundGroupId == null) return;
  if (!FUND_ALLOWED_TYPES.has(type)) {
    throw new ValidationError(
      'Fund group tagging is only allowed on TRANSFER, INVESTMENT or SINKING_DEPOSIT transactions',
    );
  }
  if (!fundGroupFlow) {
    throw new ValidationError('fundGroupFlow (IN or OUT) is required when fundGroupId is set');
  }
}

// ── Service ───────────────────────────────────────────────────────────────

export const TransactionService = {
  // ── List (cursor) ─────────────────────────────────────────────────────────

  async listWithCursor(query: ListWithCursorQuery) {
    const {
      userId,
      cursor,
      limit = 20,
      type,
      types,
      budgetPeriodYear,
      budgetPeriodMonth,
      fromDate,
      toDate,
      categoryId,
      paymentSourceId,
      status,
      search,
      sort,
    } = query;

    const rows = await TransactionRepository.findWithCursor(userId, {
      cursor,
      limit,
      type,
      types,
      budgetPeriodYear,
      budgetPeriodMonth,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      categoryId,
      paymentSourceId,
      status,
      search,
      sort,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { rows: page, hasMore, nextCursor: hasMore ? page[page.length - 1].id : null, limit };
  },

  // Whole-period Income/Expense/Net — computed server-side over every matching row, not
  // just whatever page(s) the client has paginated in. Delegates to the shared
  // getPeriodTotals so this figure can never drift from the Dashboard's or the Calendar
  // widget's — see period-spend.ts for why that matters.
  async getPeriodSummary(userId: string, year: number, month: number) {
    const { totalIncome, totalExpense, net } = await getPeriodTotals(userId, year, month);
    return { totalIncome, totalExpense, net };
  },

  // ── Single ────────────────────────────────────────────────────────────────

  async getById(id: string, userId: string) {
    const tx = await TransactionRepository.findById(id);
    assertOwned(tx, userId);
    return tx;
  },

  // ── Create — atomic: ledger entry + balance update in one DB transaction ──

  async createTransaction(dto: CreateTransactionDto) {
    const user = await UserRepository.findById(dto.userId).catch(() => {
      throw new NotFoundError('User not found');
    });

    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / 86_400_000,
    );

    validateFundGroupTag(dto.type, dto.fundGroupId, dto.fundGroupFlow);
    await evaluateFraud({
      amount: dto.amount,
      accountAgeDays,
      countryMatch: true,
      txType: dto.type,
    });

    const txDate = new Date(dto.date);

    const txData = {
      user: { connect: { id: dto.userId } },
      type: dto.type as never,
      date: txDate,
      budgetPeriodYear: dto.budgetPeriodYear,
      budgetPeriodMonth: dto.budgetPeriodMonth,
      amount: dto.amount,
      currency: 'INR',
      account: { connect: { id: dto.paymentSourceId } },
      ...(dto.toAccountId && { toAccount: { connect: { id: dto.toAccountId } } }),
      ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } }),
      paymentMethod: dto.paymentMethod as never,
      isPlanned: dto.isPlanned,
      isRecurring: dto.isRecurring,
      status: (dto.status ?? (dto.type === 'TRANSFER' ? 'CLEARED' : 'PENDING')) as never,
      merchant: dto.merchant,
      notes: dto.notes,
      tags: dto.tags ?? [],
      ...(dto.idempotencyKey && { idempotencyKey: dto.idempotencyKey }),
      ...(dto.fundGroupId && {
        fundGroupId: dto.fundGroupId,
        fundGroupFlow: dto.fundGroupFlow as never,
      }),
      ...(dto.fundId && {
        fund: { connect: { id: dto.fundId } },
        // A sinking deposit is always money going INTO the fund; TRANSFER is the only
        // other type that can carry a fund tag, and it picks its own direction.
        fundFlow: (dto.type === 'SINKING_DEPOSIT' ? 'IN' : dto.fundFlow) as never,
      }),
      ...(dto.isRecurring &&
        dto.recSchedule && {
          recurringConfig: {
            type: dto.recSchedule.frequency,
            startDate: txDate,
            dayOfMonth: txDate.getDate(),
            ...(dto.recSchedule.endDate && { endDate: new Date(dto.recSchedule.endDate) }),
          },
        }),
    };

    const delta = getBalanceDeltas({
      type: dto.type,
      amount: dto.amount,
      accountId: dto.paymentSourceId,
      toAccountId: dto.toAccountId,
    });

    return prisma.$transaction(async (tx) => {
      const created = await tx.financeTransaction.create({
        data: txData as never,
        include: TX_INCLUDE,
      });
      await applyDeltas(tx, delta);
      return created;
    });
  },

  // ── Bulk create — one bill, many line items, one atomic write ─────────────
  //
  // All-or-nothing: every item shares one prisma.$transaction, so a bad category
  // on item 8 of 12 rolls back the whole bill instead of leaving it half-logged.
  //
  // Fraud is evaluated ONCE against the bill TOTAL, not per item. The
  // high-value-new-user rule trips on amount > ₹10,000 for accounts under 30 days
  // old — a new account could split a ₹15,000 shop into twenty sub-₹10k lines and
  // never trip that rule if it were checked per item. Checking the total closes
  // that gap; per-item checks would just be redundant work against a rule that
  // was never designed to reason about one line of a receipt in isolation.
  //
  // Duplicate-checking (findDuplicates) is deliberately NOT run here. It matches
  // on {merchant, amount, date}, which is exactly what every OTHER item in this
  // same bill also shares whenever two items happen to cost the same — it would
  // flag legitimate lines against each other, not catch a real mistake. The
  // actual risk bulk entry has — resubmitting the same "Log N expenses" click
  // twice — is what idempotencyKey already exists to solve.
  async createBulk(dto: BulkCreateTransactionDto) {
    if (dto.idempotencyKey) {
      const anchor = await TransactionRepository.findByIdempotencyKey(dto.idempotencyKey);
      if (anchor && Date.now() - anchor.createdAt.getTime() < 600_000) {
        return TransactionRepository.findByBatchId(dto.userId, anchor.billBatchId!);
      }
    }

    const user = await UserRepository.findById(dto.userId).catch(() => {
      throw new NotFoundError('User not found');
    });
    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / 86_400_000,
    );

    const billTotal = dto.items.reduce((sum, item) => sum + item.amount, 0);
    await evaluateFraud({
      amount: billTotal,
      accountAgeDays,
      countryMatch: true,
      txType: dto.type,
    });

    const billBatchId = crypto.randomUUID();
    const txDate = new Date(dto.date);

    return prisma.$transaction(async (tx) => {
      const created = [];
      for (const [index, item] of dto.items.entries()) {
        const txData = {
          user: { connect: { id: dto.userId } },
          type: dto.type as never,
          date: txDate,
          budgetPeriodYear: dto.budgetPeriodYear,
          budgetPeriodMonth: dto.budgetPeriodMonth,
          amount: item.amount,
          currency: 'INR',
          account: { connect: { id: dto.paymentSourceId } },
          category: { connect: { id: item.categoryId } },
          paymentMethod: dto.paymentMethod as never,
          isPlanned: false,
          isRecurring: false,
          status: 'PENDING' as never,
          merchant: dto.merchant,
          notes: item.note ?? dto.notes,
          tags: dto.tags ?? [],
          billBatchId,
          // Every row needs a real, distinct idempotencyKey — Mongo's unique index
          // treats a MISSING field the same as an explicit null, and only tolerates
          // one such document total, so omitting it on every non-anchor row (as if
          // "no key" meant "skip the field") collides the moment a second item is
          // written, either against item 1 of this same batch or any pre-existing row
          // that also happened to lack one. The anchor (index 0) carries the client's
          // exact key, for idempotency-replay lookups; every other row gets a key
          // derived from it, unique per item, never looked up directly.
          idempotencyKey:
            index === 0 && dto.idempotencyKey ? dto.idempotencyKey : `${billBatchId}:${index}`,
        };

        const row = await tx.financeTransaction.create({ data: txData as never, include: TX_INCLUDE });

        const delta = getBalanceDeltas({
          type: dto.type,
          amount: item.amount,
          accountId: dto.paymentSourceId,
        });
        await applyDeltas(tx, delta);

        created.push(row);
      }
      return created;
    });
  },

  // ── Patch (edit) — reverse old delta, apply new delta, atomically ─────────

  async patch(id: string, userId: string, dto: PatchTransactionDto) {
    const existing = await TransactionRepository.findById(id);
    assertOwned(existing, userId);
    assertNotLocked(existing);

    const existingTyped = existing as unknown as {
      type: string;
      accountId: string;
      toAccountId: string | null;
      amount: number;
    };

    const effectiveType = dto.type ?? existingTyped.type;
    validateFundGroupTag(effectiveType, dto.fundGroupId, dto.fundGroupFlow);

    // Snapshot of what the transaction looks like BEFORE the edit
    const oldSnapshot = {
      type: existingTyped.type,
      amount: existingTyped.amount,
      accountId: existingTyped.accountId,
      toAccountId: existingTyped.toAccountId,
    };

    // Snapshot of what it will look like AFTER the edit
    const newSnapshot = {
      type: effectiveType,
      amount: dto.amount ?? oldSnapshot.amount,
      accountId: dto.paymentSourceId ?? oldSnapshot.accountId,
      toAccountId: dto.toAccountId ?? oldSnapshot.toAccountId,
    };

    const oldDelta = getBalanceDeltas(oldSnapshot);
    const newDelta = getBalanceDeltas(newSnapshot);

    // Build Prisma update payload
    const data: Record<string, unknown> = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.merchant !== undefined) data.merchant = dto.merchant;
    if (dto.paymentMethod !== undefined) data.paymentMethod = dto.paymentMethod;
    if (dto.isPlanned !== undefined) data.isPlanned = dto.isPlanned;
    if (dto.isRecurring !== undefined) data.isRecurring = dto.isRecurring;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.budgetPeriodYear !== undefined) data.budgetPeriodYear = dto.budgetPeriodYear;
    if (dto.budgetPeriodMonth !== undefined) data.budgetPeriodMonth = dto.budgetPeriodMonth;
    if (dto.paymentSourceId !== undefined) data.account = { connect: { id: dto.paymentSourceId } };
    if (dto.categoryId !== undefined) data.category = { connect: { id: dto.categoryId } };
    if (dto.toAccountId !== undefined) data.toAccount = { connect: { id: dto.toAccountId } };
    if (dto.assetClass !== undefined) data.assetClass = dto.assetClass;
    if (dto.fundName !== undefined) data.fundName = dto.fundName;
    if (dto.units !== undefined) data.units = dto.units;
    if (dto.nav !== undefined) data.nav = dto.nav;
    if (dto.mfPlan !== undefined) data.mfPlan = dto.mfPlan;
    if (dto.taxSection !== undefined) data.taxSection = dto.taxSection;
    if (dto.incomeType !== undefined) data.incomeType = dto.incomeType;
    if (dto.tds !== undefined) data.tds = dto.tds;
    if (dto.giftFrom !== undefined) data.giftFrom = dto.giftFrom;
    if (dto.occasion !== undefined) data.occasion = dto.occasion;
    if (dto.fundId !== undefined) {
      data.fund = dto.fundId ? { connect: { id: dto.fundId } } : { disconnect: true };
    }
    if (dto.fundFlow !== undefined) data.fundFlow = dto.fundFlow;
    if (dto.isTaxDed !== undefined) data.isTaxDed = dto.isTaxDed;
    if (dto.isReimbursable !== undefined) data.isReimbursable = dto.isReimbursable;
    if (dto.reimbDate !== undefined) data.reimbDate = dto.reimbDate;
    if (dto.reimbFrom !== undefined) data.reimbFrom = dto.reimbFrom;
    if (dto.origTxRef !== undefined) data.origTxRef = dto.origTxRef;
    if (dto.txPurpose !== undefined) data.txPurpose = dto.txPurpose;
    if (dto.txFee !== undefined) data.txFee = dto.txFee;
    if (dto.atmLocation !== undefined) data.atmLocation = dto.atmLocation;
    if (dto.atmPurpose !== undefined) data.atmPurpose = dto.atmPurpose;
    if (dto.refundReason !== undefined) data.refundReason = dto.refundReason;
    if (dto.origPrice !== undefined) data.origPrice = dto.origPrice;
    if (dto.couponCode !== undefined) data.couponCode = dto.couponCode;
    if (dto.platform !== undefined) data.platform = dto.platform;
    if (dto.ptsSpent !== undefined) data.ptsSpent = dto.ptsSpent;
    if (dto.ptsRate !== undefined) data.ptsRate = dto.ptsRate;
    if (dto.fundGroupId !== undefined) data.fundGroupId = dto.fundGroupId;
    if (dto.fundGroupFlow !== undefined) data.fundGroupFlow = dto.fundGroupFlow;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.financeTransaction.update({
        where: { id },
        data: data as never,
        include: TX_INCLUDE,
      });
      await applyDeltas(tx, reverseDeltas(oldDelta)); // undo old effect
      await applyDeltas(tx, newDelta); // apply new effect
      return updated;
    });
  },

  // ── Void — mark voided + reverse balance, atomically ─────────────────────

  async voidTransaction(id: string, userId: string) {
    const existing = await TransactionRepository.findById(id);
    assertOwned(existing, userId);
    assertNotLocked(existing);

    const existingTyped = existing as unknown as {
      type: string;
      amount: number;
      accountId: string;
      toAccountId: string | null;
    };

    const delta = getBalanceDeltas({
      type: existingTyped.type,
      amount: existingTyped.amount,
      accountId: existingTyped.accountId,
      toAccountId: existingTyped.toAccountId,
    });

    return prisma.$transaction(async (tx) => {
      const voided = await tx.financeTransaction.update({
        where: { id },
        data: { status: 'VOID', voidedAt: new Date() },
        include: TX_INCLUDE,
      });
      await applyDeltas(tx, reverseDeltas(delta));
      return voided;
    });
  },

  // ── Hard delete — remove record + reverse balance, atomically ─────────────

  async hardDelete(id: string, userId: string) {
    const existing = await TransactionRepository.findById(id);
    assertOwned(existing, userId);
    assertNotLocked(existing);

    const existingTyped = existing as unknown as {
      type: string;
      amount: number;
      accountId: string;
      toAccountId: string | null;
    };

    const delta = getBalanceDeltas({
      type: existingTyped.type,
      amount: existingTyped.amount,
      accountId: existingTyped.accountId,
      toAccountId: existingTyped.toAccountId,
    });

    await prisma.$transaction(async (tx) => {
      await tx.financeTransaction.delete({ where: { id } });
      await applyDeltas(tx, reverseDeltas(delta));
    });
  },

  // ── Duplicate check ───────────────────────────────────────────────────────

  async checkDuplicates(userId: string, merchant: string, amount: number, dateStr: string) {
    return TransactionRepository.findDuplicates(userId, merchant, amount, new Date(dateStr));
  },

  async checkDuplicatesV1(userId: string, merchant: string, amount: number, dateStr: string) {
    const dupes = await TransactionRepository.findDuplicates(
      userId,
      merchant,
      amount,
      new Date(dateStr),
    );
    if (dupes.length > 0) throw new DuplicateDetectedError(dupes[0].id);
    return null;
  },

  // ── Legacy OFFSET list ────────────────────────────────────────────────────

  async getTransactions(query: GetTransactionsQuery) {
    const { userId, page = 1, limit = 20, type, fromDate, toDate, categoryId, search } = query;
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      TransactionRepository.findByUserId(userId, {
        skip,
        take: limit,
        type,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        categoryId,
        search,
      }),
      TransactionRepository.countByUserId(userId),
    ]);
    return { rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
};
