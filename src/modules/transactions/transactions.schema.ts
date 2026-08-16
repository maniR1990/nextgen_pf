import { z } from 'zod';

const PAYMENT_METHOD_VALUES = [
  'UPI',
  'NEFT',
  'IMPS',
  'RTGS',
  'CARD_SWIPE',
  'CARD_ONLINE',
  'CASH',
  'CHEQUE',
  'AUTO_DEBIT',
  'ATM',
  'GIFT_CARD',
  'POINTS',
  'COUPON',
  'STORE_CREDIT',
] as const;

const budgetPeriodSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

const recScheduleSchema = z.object({
  frequency: z.string().min(1),
  every: z.number().int().min(1).max(12),
  endCondition: z.enum(['forever', 'count', 'date']),
  count: z.number().int().min(1).optional(),
  endDate: z.string().optional(),
});

export const CreateTransactionSchema = z
  .object({
    userId: z.string().min(1).optional(),
    type: z.enum([
      'EXPENSE',
      'INVESTMENT',
      'SINKING_DEPOSIT',
      'INCOME',
      'GIFT_RECEIVED',
      'REIMBURSEMENT',
      'TRANSFER',
      'ATM_WITHDRAWAL',
      'REFUND',
      'COUPON_REDEMPTION',
      'POINTS_REDEMPTION',
    ]),
    date: z.string().min(1, 'Date is required'),
    budgetPeriodYear: z.number().int().min(2020),
    budgetPeriodMonth: z.number().int().min(1).max(12),
    amount: z.number().positive('Amount must be greater than ₹0'),
    paymentSourceId: z.string().min(1, 'Payment source required'),
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
    isPlanned: z.boolean(),
    isRecurring: z.boolean(),
    status: z.enum(['PENDING', 'CLEARED', 'VOID', 'RECONCILED']).default('PENDING'),

    // Optional / conditional
    merchant: z.string().optional(),
    categoryId: z.string().optional(),
    toAccountId: z.string().optional(),
    notes: z.string().max(500).optional(),
    tags: z.array(z.string()).optional(),

    // Investment
    assetClass: z.string().optional(),
    fundName: z.string().optional(),
    units: z.number().positive().optional(),
    nav: z.number().positive().optional(),
    mfPlan: z.string().optional(),
    taxSection: z.string().optional(),

    // Income
    incomeType: z.string().optional(),
    tds: z.number().min(0).optional(),

    // Gift
    giftFrom: z.string().optional(),
    occasion: z.string().optional(),

    // Sinking / fund purpose-tag (also used by TRANSFER — see fundFlow below)
    fundId: z.string().optional(),
    fundFlow: z.enum(['IN', 'OUT']).optional(),

    // Expense extras
    isTaxDed: z.boolean().optional(),
    isReimbursable: z.boolean().optional(),
    reimbDate: z.string().optional(),

    // Reimbursement
    reimbFrom: z.string().optional(),
    origTxRef: z.string().optional(),

    // Transfer
    txPurpose: z.string().optional(),
    txFee: z.number().min(0).optional(),

    // ATM
    atmLocation: z.string().optional(),
    atmPurpose: z.string().optional(),

    // Refund
    refundReason: z.string().optional(),

    // Coupon
    origPrice: z.number().positive().optional(),
    couponCode: z.string().optional(),
    platform: z.string().optional(),

    // Points
    ptsSpent: z.number().positive().optional(),
    ptsRate: z.number().positive().optional(),

    // Recurring
    recSchedule: recScheduleSchema.optional(),

    // Project linkage
    projectId: z.string().optional(),
    projectForecastLineId: z.string().optional(),
    projectVendorId: z.string().optional(),
    projectPaymentType: z.enum(['ADVANCE', 'MILESTONE', 'FINAL', 'REFUND']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.projectForecastLineId && !data.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'projectId is required when projectForecastLineId is set',
        path: ['projectId'],
      });
    }
    if (data.projectVendorId && !data.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'projectId is required when projectVendorId is set',
        path: ['projectId'],
      });
    }
    if (data.projectPaymentType && !data.projectVendorId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'projectVendorId is required when projectPaymentType is set',
        path: ['projectVendorId'],
      });
    }
    const requiredMerchant = [
      'EXPENSE',
      'INCOME',
      'GIFT_RECEIVED',
      'REIMBURSEMENT',
      'REFUND',
      'COUPON_REDEMPTION',
      'POINTS_REDEMPTION',
    ];
    if (requiredMerchant.includes(data.type) && !data.merchant?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Merchant or description is required',
        path: ['merchant'],
      });
    }

    // Project-tagged expenses are exempt — a project's own forecast lines are the
    // budget breakdown now, not the monthly category tree, so forcing a category
    // pick here would just be friction with no reporting payoff.
    if (data.type === 'EXPENSE' && !data.categoryId && !data.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a category',
        path: ['categoryId'],
      });
    }

    if (data.type === 'INCOME' && !data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a category',
        path: ['categoryId'],
      });
    }

    // Sinking Deposit joins Transfer/ATM Withdrawal here — a sinking contribution
    // always lands in a real account (a savings account, a goal wallet), same as any
    // other money movement. fundId (below) stays optional: linking it to a Fund's
    // progress tracking is enrichment, not a prerequisite for logging the deposit.
    if (
      (data.type === 'TRANSFER' ||
        data.type === 'ATM_WITHDRAWAL' ||
        data.type === 'SINKING_DEPOSIT') &&
      !data.toAccountId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Destination account is required',
        path: ['toAccountId'],
      });
    }

    if (data.isRecurring && !data.recSchedule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Recurring schedule is required',
        path: ['recSchedule'],
      });
    }
  });

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

// ── v1 query params ───────────────────────────────────────────────────────────

export const ListTransactionsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  types: z.string().optional(), // comma-separated for multi-type chips (transfer)
  budgetPeriodYear: z.coerce.number().int().min(2020).max(2100).optional(),
  budgetPeriodMonth: z.coerce.number().int().min(1).max(12).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  categoryId: z.string().optional(),
  paymentSourceId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['date_desc', 'date_asc']).default('date_desc'),
});

export const PeriodSummaryQuerySchema = z.object({
  budgetPeriodYear: z.coerce.number().int().min(2020).max(2100),
  budgetPeriodMonth: z.coerce.number().int().min(1).max(12),
});

// ── PATCH (full update — all fields optional) ─────────────────────────────────

export const PatchTransactionSchema = z.object({
  type: z
    .enum([
      'EXPENSE',
      'INVESTMENT',
      'SINKING_DEPOSIT',
      'INCOME',
      'GIFT_RECEIVED',
      'REIMBURSEMENT',
      'TRANSFER',
      'ATM_WITHDRAWAL',
      'REFUND',
      'COUPON_REDEMPTION',
      'POINTS_REDEMPTION',
    ])
    .optional(),
  date: z.string().min(1).optional(),
  budgetPeriodYear: z.number().int().min(2020).max(2100).optional(),
  budgetPeriodMonth: z.number().int().min(1).max(12).optional(),
  amount: z.number().positive().optional(),
  paymentSourceId: z.string().min(1).optional(),
  paymentMethod: z.enum(PAYMENT_METHOD_VALUES).optional(),
  isPlanned: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  merchant: z.string().max(120).optional(),
  categoryId: z.string().optional(),
  toAccountId: z.string().optional(),
  notes: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  assetClass: z.string().optional(),
  fundName: z.string().optional(),
  units: z.number().positive().optional(),
  nav: z.number().positive().optional(),
  mfPlan: z.string().optional(),
  taxSection: z.string().optional(),
  incomeType: z.string().optional(),
  tds: z.number().min(0).optional(),
  giftFrom: z.string().optional(),
  occasion: z.string().optional(),
  fundId: z.string().optional(),
  fundFlow: z.enum(['IN', 'OUT']).optional(),
  isTaxDed: z.boolean().optional(),
  isReimbursable: z.boolean().optional(),
  reimbDate: z.string().optional(),
  reimbFrom: z.string().optional(),
  origTxRef: z.string().optional(),
  txPurpose: z.string().optional(),
  txFee: z.number().min(0).optional(),
  atmLocation: z.string().optional(),
  atmPurpose: z.string().optional(),
  refundReason: z.string().optional(),
  origPrice: z.number().positive().optional(),
  couponCode: z.string().optional(),
  platform: z.string().optional(),
  ptsSpent: z.number().positive().optional(),
  ptsRate: z.number().positive().optional(),
  recSchedule: recScheduleSchema.optional(),
  // Project linkage — projectId itself is deliberately not patchable (a transaction
  // doesn't move between projects); these just reclassify it within its own project.
  projectForecastLineId: z.string().optional(),
  projectVendorId: z.string().optional(),
  projectPaymentType: z.enum(['ADVANCE', 'MILESTONE', 'FINAL', 'REFUND']).optional(),
});

// ── check-duplicate ───────────────────────────────────────────────────────────

export const CheckDuplicateSchema = z.object({
  merchant: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
});

// ── Bulk create — one bill/deposit, many line items ────────────────────────────
// Shared bill-level fields are supplied once (date/account/payment method are the
// same for every item); only categoryId + amount vary per line. Originally
// EXPENSE-only (one receipt, several categories); also covers SINKING_DEPOSIT and
// INVESTMENT now (one lump-sum contribution — e.g. topping up several budgeted
// bills at once from a sinking fund — logged as N linked transactions sharing one
// destination account instead of N separate manual entries).

export const BulkTransactionItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be greater than ₹0'),
  note: z.string().max(200).optional(),
});

export const BulkCreateTransactionSchema = z
  .object({
    type: z.enum(['EXPENSE', 'INVESTMENT', 'SINKING_DEPOSIT']),
    // Required for EXPENSE (what the bill was for); meaningless for a sinking/
    // investment contribution, which already has toAccountId to say where it went.
    merchant: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    budgetPeriodYear: z.number().int().min(2020),
    budgetPeriodMonth: z.number().int().min(1).max(12),
    paymentSourceId: z.string().min(1, 'Payment source required'),
    toAccountId: z.string().optional(),
    fundId: z.string().optional(),
    paymentMethod: z.enum(PAYMENT_METHOD_VALUES),
    notes: z.string().max(500).optional(),
    tags: z.array(z.string()).optional(),
    items: z
      .array(BulkTransactionItemSchema)
      .min(1, 'At least one item is required')
      .max(50, 'A single batch can log at most 50 items'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'EXPENSE' && !data.merchant?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Merchant or description is required',
        path: ['merchant'],
      });
    }
    // Same rule as CreateTransactionSchema: a sinking contribution always lands in
    // a real account.
    if (data.type === 'SINKING_DEPOSIT' && !data.toAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Destination account is required',
        path: ['toAccountId'],
      });
    }
  });

export type BulkCreateTransactionInput = z.infer<typeof BulkCreateTransactionSchema>;
