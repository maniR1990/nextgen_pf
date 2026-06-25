import { ACCOUNT_SORT_OPTIONS, ACCOUNT_STATUSES, ACCOUNT_TYPES } from '@/constants/accounts';
import type { AccountType } from '@prisma/client';
import { z } from 'zod';

const accountTypeSchema = z.enum(ACCOUNT_TYPES as [AccountType, ...AccountType[]]);

const billingCycleSchema = z.object({
  startDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
});

const fundAllocationSchema = z.object({
  fundId: z.string().min(1),
  accountId: z.string().min(1).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().finite().nonnegative(),
  priority: z.number().int().min(0).default(0),
});

const accountFieldsSchema = z.object({
  name: z.string().min(1).max(120),
  type: accountTypeSchema,
  groupId: z.string().min(1),
  institutionId: z.string().min(1).optional(),
  balance: z.number().finite().default(0),
  openingBalance: z.number().finite().default(0),
  subtype: z.string().max(40).optional(),
  currency: z.string().length(3).default('INR'),
  accountNumber: z.string().max(20).optional(),
  ifscCode: z.string().max(11).optional(),
  upiId: z.string().max(80).optional(),
  creditLimit: z.number().positive().optional(),
  billingCycle: billingCycleSchema.optional(),
  interestRate: z.number().finite().min(0).max(100).optional(),
  minimumPayment: z.number().finite().nonnegative().optional(),
  investedAmount: z.number().finite().optional(),
  currentValue: z.number().finite().optional(),
  absoluteReturn: z.number().finite().optional(),
  xirr: z.number().finite().optional(),
  maturityDate: z.string().datetime().optional(),
  lockInMonths: z.number().int().min(0).optional(),
  expectedReturn: z.number().finite().optional(),
  category80C: z.boolean().optional(),
  principalAmount: z.number().finite().positive().optional(),
  emi: z.number().finite().positive().optional(),
  remainingEmis: z.number().int().min(0).optional(),
  interestPaidTotal: z.number().finite().min(0).optional(),
  fundAllocations: z.array(fundAllocationSchema).optional(),
  linkedAccountIds: z.array(z.string().min(1)).optional(),
  status: z
    .enum(ACCOUNT_STATUSES as unknown as ['ACTIVE', 'INACTIVE', 'CLOSED', 'FROZEN'])
    .optional(),
  isPrimary: z.boolean().optional(),
  isExcludeNetWorth: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  color: z.string().max(7).optional(),
  icon: z.string().max(60).optional(),
  note: z.string().max(500).optional(),
  tags: z.array(z.string().max(40)).optional(),
  openedOn: z.string().datetime().optional(),
});

export const CreateAccountSchema = accountFieldsSchema;

export const UpdateAccountSchema = accountFieldsSchema.partial();

export const ListAccountsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(ACCOUNT_SORT_OPTIONS).default('name_asc'),
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
  groupId: z.string().min(1).optional(),
  type: accountTypeSchema.optional(),
});

export const PatchBalanceSchema = z.object({
  balance: z.number().finite('Balance must be a finite number'),
  note: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
});

export const TransferAccountSchema = z.object({
  toAccountId: z.string().min(1),
  amount: z.number().positive('Amount must be greater than zero'),
  note: z.string().max(500).optional(),
  date: z.string().datetime().optional(),
});
