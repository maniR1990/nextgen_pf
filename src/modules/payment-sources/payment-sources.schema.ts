import { z } from 'zod';

export const CreatePaymentSourceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    'BANK_SALARY',
    'BANK_SAVINGS',
    'BANK_CURRENT',
    'CREDIT_CARD',
    'CASH_WALLET',
    'ATM_CASH',
    'GIFT_CARD',
    'CASH_GIFT',
    'DIGITAL_WALLET',
    'UPI',
    'COUPON_WALLET',
    'POINTS_WALLET',
    'STORE_CREDIT',
    'INVESTMENT_ACC',
    'SUKANYA',
    'FD',
    'PPF',
    'NPS',
  ]),
  bank: z.string().max(80).optional(),
  accountNumberLast4: z.string().length(4).optional(),
  currentBalance: z.number().finite().default(0),
  creditLimit: z.number().positive().optional(),
});

export const UpdateBalanceSchema = z.object({
  balance: z.number().finite('Balance must be a finite number'),
});

export const StatementQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
