export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = 'API_ERROR',
    public headers?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message = 'Invalid input',
    public errors?: unknown,
  ) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(
    message = 'Unauthorized',
    public details?: Record<string, unknown>,
  ) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export class GoneError extends ApiError {
  constructor(message = 'Token expired') {
    super(message, 410, 'GONE');
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(retryAfterSec: number) {
    super('Too many requests', 429, 'RATE_LIMITED', {
      'Retry-After': String(retryAfterSec),
    });
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR');
  }
}

export class FraudDetectedError extends ApiError {
  constructor(message = 'Fraud detected') {
    super(message, 403, 'FRAUD_DETECTED');
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

// ── v1 domain errors (PDF error registry) ────────────────────────────────────

export class DuplicateDetectedError extends ApiError {
  constructor(public readonly txId: string) {
    super('Duplicate transaction detected', 409, 'DUPLICATE_DETECTED');
  }
}

/** Reconciled transaction — cannot be modified, create an adjustment tx instead */
export class TxLockedError extends ApiError {
  constructor() {
    super('Reconciled transaction cannot be modified', 423, 'TX_LOCKED');
  }
}

export class ConcurrentEditError extends ApiError {
  constructor() {
    super('ETag mismatch — fetch latest then retry', 409, 'CONCURRENT_EDIT');
  }
}

export class SourceNotFoundError extends NotFoundError {
  constructor() {
    super('Payment source not found in your sources');
    Object.assign(this, { code: 'SOURCE_NOT_FOUND' });
  }
}

export class AccountNotFoundError extends NotFoundError {
  constructor() {
    super('Account not found');
    Object.assign(this, { code: 'ACCOUNT_NOT_FOUND' });
  }
}

export class AccountArchiveBlockedError extends ConflictError {
  constructor(reason: string) {
    super(`Cannot archive account: ${reason}`);
    Object.assign(this, { code: 'ACCOUNT_ARCHIVE_BLOCKED' });
  }
}

export class AccountGroupNotFoundError extends NotFoundError {
  constructor() {
    super('Account group not found');
    Object.assign(this, { code: 'ACCOUNT_GROUP_NOT_FOUND' });
  }
}

export class AccountGroupHasAccountsError extends ConflictError {
  constructor(count: number) {
    super(`Cannot delete group with ${count} assigned account(s)`);
    Object.assign(this, { code: 'ACCOUNT_GROUP_HAS_ACCOUNTS' });
  }
}

export class FundNotFoundError extends NotFoundError {
  constructor() {
    super('Fund not found');
    Object.assign(this, { code: 'FUND_NOT_FOUND' });
  }
}

export class FundAllocationNotFoundError extends NotFoundError {
  constructor() {
    super('Fund allocation not found for this account');
    Object.assign(this, { code: 'FUND_ALLOCATION_NOT_FOUND' });
  }
}

export class FundGroupNotFoundError extends NotFoundError {
  constructor() {
    super('Fund group not found');
    Object.assign(this, { code: 'FUND_GROUP_NOT_FOUND' });
  }
}

export class FundGroupSystemError extends ConflictError {
  constructor() {
    super('System fund groups cannot be deleted');
    Object.assign(this, { code: 'FUND_GROUP_SYSTEM' });
  }
}

export class FundGroupHasFundsError extends ConflictError {
  constructor(count: number) {
    super(`Cannot delete group with ${count} active fund(s). Move or archive funds first.`);
    Object.assign(this, { code: 'FUND_GROUP_HAS_FUNDS' });
  }
}

export class CategoryNotFoundError extends NotFoundError {
  constructor() {
    super('Category not found in your category tree');
    Object.assign(this, { code: 'CATEGORY_NOT_FOUND' });
  }
}

export class CategoryHasTransactionsError extends ConflictError {
  constructor(count: number) {
    super(
      `Cannot delete category with ${count} linked transaction(s). Reassign transactions first.`,
    );
    Object.assign(this, { code: 'CATEGORY_HAS_TRANSACTIONS' });
  }
}

export class CategoryDepthExceededError extends ConflictError {
  constructor() {
    super('Category hierarchy cannot exceed 3 levels (group → category → subcategory)');
    Object.assign(this, { code: 'CATEGORY_DEPTH_EXCEEDED' });
  }
}

export class BudgetPeriodInvalidError extends ApiError {
  constructor() {
    super('Budget period year/month out of range or too far future', 400, 'BUDGET_PERIOD_INVALID');
  }
}

export class FileTooLargeError extends ApiError {
  constructor() {
    super('Upload exceeds 10 MB limit', 413, 'FILE_TOO_LARGE');
  }
}

export class UnsupportedFileTypeError extends ApiError {
  constructor() {
    super('File type not supported. Only JPEG, PNG, PDF', 415, 'UNSUPPORTED_TYPE');
  }
}

export class AttachmentLimitError extends ApiError {
  constructor() {
    super('Max 5 attachments per transaction reached', 400, 'ATTACHMENT_LIMIT');
  }
}

export class DeleteNotConfirmedError extends ApiError {
  constructor() {
    super('X-Confirm-Delete header missing or not true', 400, 'DELETE_NOT_CONFIRMED');
  }
}
