import { z } from 'zod';

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
    paymentMethod: z.enum([
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
    ]),
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

    // Sinking
    sfId: z.string().optional(),

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
  })
  .superRefine((data, ctx) => {
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

    if (data.type === 'EXPENSE' && !data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a category',
        path: ['categoryId'],
      });
    }

    if (data.type === 'SINKING_DEPOSIT' && !data.sfId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a sinking fund',
        path: ['sfId'],
      });
    }

    if (data.type === 'INCOME' && !data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select a category',
        path: ['categoryId'],
      });
    }

    if (data.type === 'TRANSFER' && !data.toAccountId) {
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
  status: z.string().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['date_desc', 'date_asc']).default('date_desc'),
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
  paymentMethod: z
    .enum([
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
    ])
    .optional(),
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
  sfId: z.string().optional(),
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
});

// ── check-duplicate ───────────────────────────────────────────────────────────

export const CheckDuplicateSchema = z.object({
  merchant: z.string().min(1),
  amount: z.number().positive(),
  date: z.string().min(1),
});
