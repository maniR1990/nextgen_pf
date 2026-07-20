import { isApiError } from '@/lib/api/errors';
import { compose, withAuth, withIdempotency, withValidation } from '@/lib/api/middleware';
import { v1Created, v1FromApiError, v1Ok, v1Paginated } from '@/lib/api/v1/envelope';
import { getLogger } from '@/lib/logger';
import { getIncomePeriodData } from '@/lib/utils/incomePeriod';
import {
  BulkCreateTransactionSchema,
  CheckDuplicateSchema,
  CreateTransactionSchema,
  ListTransactionsQuerySchema,
  PatchTransactionSchema,
  PeriodSummaryQuerySchema,
} from './transactions.schema';
import { TransactionService } from './transactions.service';

const log = getLogger('TransactionRouter');

// ── Legacy handlers (existing /api/transactions) ──────────────────────────────

export const handleCreateTransaction = compose(
  withAuth(),
  withValidation(CreateTransactionSchema),
)(async (req, ctx) => {
  try {
    const body = await req.json();
    const dto = { ...body, userId: ctx.session!.id };
    const transaction = await TransactionService.createTransaction(dto);
    return v1Created(transaction);
  } catch (err) {
    log.error('createTransaction', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleGetTransactions = compose(withAuth())(async (req, ctx) => {
  try {
    const url = new URL(req.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const type = url.searchParams.get('type') ?? undefined;
    const fromDate = url.searchParams.get('fromDate') ?? undefined;
    const toDate = url.searchParams.get('toDate') ?? undefined;
    const categoryId = url.searchParams.get('categoryId') ?? undefined;
    const search = url.searchParams.get('search') ?? undefined;

    const result = await TransactionService.getTransactions({
      userId: ctx.session!.id,
      page,
      limit,
      type: type as never,
      fromDate,
      toDate,
      categoryId,
      search,
    });

    return v1Ok(result);
  } catch (err) {
    log.error('getTransactions', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const handleCheckDuplicates = compose(withAuth())(async (req, ctx) => {
  try {
    const { merchant, amount, date } = await req.json();
    const dupes = await TransactionService.checkDuplicates(ctx.session!.id, merchant, amount, date);
    return v1Ok(dupes);
  } catch (err) {
    log.error('checkDuplicates', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

// ── v1 handlers ───────────────────────────────────────────────────────────────

export const v1ListTransactions = compose(withAuth())(async (req, ctx) => {
  try {
    const url = new URL(req.url);
    const parsed = ListTransactionsQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success)
      return v1FromApiError({
        message: 'Invalid query params',
        status: 422,
        code: 'VALIDATION_ERROR',
      });

    const typesParam = parsed.data.types?.split(',').filter(Boolean) as never[] | undefined;

    const result = await TransactionService.listWithCursor({
      userId: ctx.session!.id,
      ...parsed.data,
      type: parsed.data.type as never,
      types: typesParam?.length ? typesParam : undefined,
      status: parsed.data.status as never,
    });

    return v1Paginated(result.rows, {
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      limit: result.limit,
    });
  } catch (err) {
    log.error('v1ListTransactions', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1GetTransactionsSummary = compose(withAuth())(async (req, ctx) => {
  try {
    const url = new URL(req.url);
    const parsed = PeriodSummaryQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success)
      return v1FromApiError({
        message: 'Invalid query params',
        status: 422,
        code: 'VALIDATION_ERROR',
      });

    const summary = await TransactionService.getPeriodSummary(
      ctx.session!.id,
      parsed.data.budgetPeriodYear,
      parsed.data.budgetPeriodMonth,
    );

    return v1Ok(summary);
  } catch (err) {
    log.error('v1GetTransactionsSummary', { err });
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1CreateTransaction = compose(
  withAuth(),
  withIdempotency(),
  withValidation(CreateTransactionSchema),
)(async (req, ctx) => {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get('x-idempotency-key') ?? undefined;
    const dto = { ...body, userId: ctx.session!.id, idempotencyKey };
    const transaction = await TransactionService.createTransaction(dto);
    return v1Created(transaction);
  } catch (err) {
    log.error('v1CreateTransaction', { err });
    if (isApiError(err)) return v1FromApiError(err);
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

// Bulk create deliberately does NOT use the generic withIdempotency() middleware —
// that middleware replays a single row by idempotencyKey, but idempotencyKey is
// @unique so only the anchor row of a batch can ever carry it. TransactionService
// .createBulk does its own key lookup and expands the anchor into the full batch via
// billBatchId — see the comment on createBulk for the full reasoning.
export const v1CreateBulkTransaction = compose(
  withAuth(),
  withValidation(BulkCreateTransactionSchema),
)(async (req, ctx) => {
  try {
    const body = await req.json();
    const idempotencyKey = req.headers.get('x-idempotency-key') ?? undefined;
    const dto = { ...body, userId: ctx.session!.id, idempotencyKey };
    const transactions = await TransactionService.createBulk(dto);
    return v1Created(transactions);
  } catch (err) {
    log.error('v1CreateBulkTransaction', { err });
    if (isApiError(err)) return v1FromApiError(err);
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return v1FromApiError({ message: msg, status: 500, code: 'INTERNAL_ERROR' });
  }
});

export const v1GetTransaction = compose(withAuth())(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const tx = await TransactionService.getById(id, ctx.session!.id);
    return v1Ok(tx);
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1PatchTransaction = compose(
  withAuth(),
  withValidation(PatchTransactionSchema),
)(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const body = await req.json();
    const tx = await TransactionService.patch(id, ctx.session!.id, body);
    return v1Ok(tx);
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1DeleteTransaction = compose(withAuth())(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });

    const confirmHeader = req.headers.get('x-confirm-delete');
    if (confirmHeader !== 'true') {
      return v1FromApiError({
        message: 'X-Confirm-Delete header missing or not true',
        status: 400,
        code: 'DELETE_NOT_CONFIRMED',
      });
    }

    await TransactionService.hardDelete(id, ctx.session!.id);
    return v1Ok({ deleted: true });
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

export const v1VoidTransaction = compose(withAuth())(async (req, ctx) => {
  try {
    const id = ctx.params?.id;
    if (!id)
      return v1FromApiError({ message: 'Missing id', status: 400, code: 'VALIDATION_ERROR' });
    const tx = await TransactionService.voidTransaction(id, ctx.session!.id);
    return v1Ok(tx);
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});

// Returns last-working-day hint + budget period suggestions for a given income date.
// Pure date computation — no DB access.
export const v1GetIncomePeriod = compose(withAuth())(async (req) => {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return v1FromApiError({
      message: 'date query param required (YYYY-MM-DD)',
      status: 400,
      code: 'VALIDATION_ERROR',
    });
  }
  return v1Ok(getIncomePeriodData(date));
});

export const v1CheckDuplicate = compose(withAuth())(async (req, ctx) => {
  try {
    const body = await req.json();
    const parsed = CheckDuplicateSchema.safeParse(body);
    if (!parsed.success)
      return v1FromApiError({ message: 'Invalid body', status: 422, code: 'VALIDATION_ERROR' });

    await TransactionService.checkDuplicatesV1(
      ctx.session!.id,
      parsed.data.merchant,
      parsed.data.amount,
      parsed.data.date,
    );
    return v1Ok({ duplicate: false });
  } catch (err) {
    if (isApiError(err)) return v1FromApiError(err);
    throw err;
  }
});
