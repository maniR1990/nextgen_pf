import { DuplicateDetectedError, ForbiddenError, NotFoundError, TxLockedError, ValidationError } from '@/lib/api/errors';
import { evaluateFraud } from '@/lib/rules-engine/evaluator';
import { UserRepository } from '@/modules/users/users.repository';
import { TransactionRepository } from './transactions.repository';
import type { CreateTransactionDto, GetTransactionsQuery, ListWithCursorQuery, PatchTransactionDto } from './transactions.types';

const FUND_ALLOWED_TYPES = new Set(['TRANSFER', 'INVESTMENT', 'SINKING_DEPOSIT']);

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
      `Fund group tagging is only allowed on TRANSFER, INVESTMENT or SINKING_DEPOSIT transactions`,
    );
  }
  if (!fundGroupFlow) {
    throw new ValidationError('fundGroupFlow (IN or OUT) is required when fundGroupId is set');
  }
}

export const TransactionService = {
  // ── v1 cursor list ────────────────────────────────────────────────────────

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
    return {
      rows: page,
      hasMore,
      nextCursor: hasMore ? page[page.length - 1].id : null,
      limit,
    };
  },

  // ── v1 single ─────────────────────────────────────────────────────────────

  async getById(id: string, userId: string) {
    const tx = await TransactionRepository.findById(id);
    assertOwned(tx, userId);
    return tx;
  },

  // ── v1 create ─────────────────────────────────────────────────────────────

  async createTransaction(dto: CreateTransactionDto) {
    let user;
    try {
      user = await UserRepository.findById(dto.userId);
    } catch {
      throw new NotFoundError('User not found');
    }

    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.createdAt).getTime()) / 86_400_000,
    );

    validateFundGroupTag(dto.type, dto.fundGroupId, dto.fundGroupFlow);

    await evaluateFraud({ amount: dto.amount, accountAgeDays, countryMatch: true });

    const txDate = new Date(dto.date);

    return TransactionRepository.create({
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
      status: (dto.status ?? 'PENDING') as never,
      merchant: dto.merchant,
      notes: dto.notes,
      tags: dto.tags ?? [],
      ...(dto.idempotencyKey && { idempotencyKey: dto.idempotencyKey }),
      ...(dto.fundGroupId && { fundGroupId: dto.fundGroupId, fundGroupFlow: dto.fundGroupFlow as never }),
      ...(dto.isRecurring && dto.recSchedule && {
        recurringConfig: {
          type: dto.recSchedule.frequency,
          startDate: txDate,
          dayOfMonth: txDate.getDate(),
          ...(dto.recSchedule.endDate && { endDate: new Date(dto.recSchedule.endDate) }),
        },
      }),
    });
  },

  // ── v1 patch ──────────────────────────────────────────────────────────────

  async patch(id: string, userId: string, dto: PatchTransactionDto) {
    const tx = await TransactionRepository.findById(id);
    assertOwned(tx, userId);
    assertNotLocked(tx);

    const effectiveType = (dto.type ?? (tx as unknown as { type: string }).type) as string;
    validateFundGroupTag(effectiveType, dto.fundGroupId, dto.fundGroupFlow);

    // Build Prisma-compatible update object with relation handling
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
    // Type-specific direct fields
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
    if (dto.sfId !== undefined) data.sfId = dto.sfId;
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
    if (dto.fundGroupId !== undefined) {
      data.fundGroupId = dto.fundGroupId;
    }
    if (dto.fundGroupFlow !== undefined) data.fundGroupFlow = dto.fundGroupFlow;

    return TransactionRepository.update(id, data as never);
  },

  // ── v1 void ───────────────────────────────────────────────────────────────

  async voidTransaction(id: string, userId: string) {
    const tx = await TransactionRepository.findById(id);
    assertOwned(tx, userId);
    assertNotLocked(tx);
    return TransactionRepository.void(id);
  },

  // ── v1 hard delete ────────────────────────────────────────────────────────

  async hardDelete(id: string, userId: string) {
    const tx = await TransactionRepository.findById(id);
    assertOwned(tx, userId);
    assertNotLocked(tx);
    await TransactionRepository.hardDelete(id);
  },

  // ── duplicate check ───────────────────────────────────────────────────────

  async checkDuplicates(userId: string, merchant: string, amount: number, dateStr: string) {
    return TransactionRepository.findDuplicates(userId, merchant, amount, new Date(dateStr));
  },

  async checkDuplicatesV1(userId: string, merchant: string, amount: number, dateStr: string) {
    const dupes = await TransactionRepository.findDuplicates(userId, merchant, amount, new Date(dateStr));
    if (dupes.length > 0) throw new DuplicateDetectedError(dupes[0].id);
    return null;
  },

  // ── legacy OFFSET list (backward compat) ──────────────────────────────────

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
