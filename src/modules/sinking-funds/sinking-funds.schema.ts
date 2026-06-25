import { z } from 'zod';

export const DepositSchema = z.object({
  amount: z.number().positive('Deposit amount must be > 0'),
});
