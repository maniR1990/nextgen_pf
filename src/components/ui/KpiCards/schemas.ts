import { KPI_CARD_TYPE, KPI_CARD_TYPE_VALUES, type KpiCardType } from '@/constants/kpiCards';
import { z } from 'zod';

export const KpiMoneyAmountSchema = z.object({
  amountMinor: z.number().int(),
  currency: z.string().default('INR'),
});

export const KpiProgressRangeSchema = z.object({
  current: z.number().nonnegative(),
  target: z.number().positive(),
  currentLabel: z.string().optional(),
  targetLabel: z.string().optional(),
});

export const KpiCashRunwayDataSchema = z.object({
  title: z.string(),
  value: z.number(),
  unit: z.string(),
  progress: KpiProgressRangeSchema,
  insight: z.string(),
  variant: z.enum(['default', 'warning']).optional(),
});

export const KpiSparklinePointSchema = z.object({
  value: z.number().nonnegative(),
});

export const KpiBankCashDataSchema = z.object({
  title: z.string(),
  amount: KpiMoneyAmountSchema,
  sparkline: z.array(z.number().nonnegative()).min(1).max(12),
  trend: z.object({
    direction: z.enum(['up', 'down', 'flat']),
    amountMinor: z.number().int(),
    periodLabel: z.string(),
  }),
});

export const KpiActionChipSchema = z.object({
  label: z.string(),
  variant: z.enum(['brand', 'success', 'neutral']).optional(),
});

export const KpiMonthlySurplusDataSchema = z.object({
  title: z.string(),
  amount: KpiMoneyAmountSchema,
  actions: z.array(KpiActionChipSchema).min(1),
});

export const KpiSavingsRateDataSchema = z.object({
  title: z.string(),
  ratePercent: z.number().min(0).max(100),
  targetPercent: z.number().min(0).max(100),
  benchmark: z.object({
    label: z.string(),
    status: z.enum(['above', 'below', 'on-track']),
  }),
});

export const KpiMonthBurnRateDataSchema = z.object({
  title: z.string(),
  amount: KpiMoneyAmountSchema,
  spentLabel: z.string(),
  progress: KpiProgressRangeSchema,
  dayLabel: z.string(),
  budgetStatus: z.object({
    label: z.string(),
    variant: z.enum(['success', 'warning', 'error', 'neutral']),
  }),
});

export const KpiCcDebtDataSchema = z.object({
  title: z.string(),
  amount: KpiMoneyAmountSchema,
  paidOff: z.boolean().optional(),
});

export const KpiCardItemSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal(KPI_CARD_TYPE.CASH_RUNWAY), data: KpiCashRunwayDataSchema }),
  z.object({ type: z.literal(KPI_CARD_TYPE.BANK_CASH), data: KpiBankCashDataSchema }),
  z.object({ type: z.literal(KPI_CARD_TYPE.MONTHLY_SURPLUS), data: KpiMonthlySurplusDataSchema }),
  z.object({ type: z.literal(KPI_CARD_TYPE.SAVINGS_RATE), data: KpiSavingsRateDataSchema }),
  z.object({ type: z.literal(KPI_CARD_TYPE.MONTH_BURN_RATE), data: KpiMonthBurnRateDataSchema }),
  z.object({ type: z.literal(KPI_CARD_TYPE.CC_DEBT), data: KpiCcDebtDataSchema }),
]);

export const KpiCardsPayloadSchema = z.object({
  cards: z.array(KpiCardItemSchema),
});

export const KpiCardTypeSchema = z.enum(KPI_CARD_TYPE_VALUES as [KpiCardType, ...KpiCardType[]]);

export type KpiMoneyAmount = z.infer<typeof KpiMoneyAmountSchema>;
export type KpiProgressRange = z.infer<typeof KpiProgressRangeSchema>;
export type KpiCashRunwayData = z.infer<typeof KpiCashRunwayDataSchema>;
export type KpiBankCashData = z.infer<typeof KpiBankCashDataSchema>;
export type KpiActionChip = z.infer<typeof KpiActionChipSchema>;
export type KpiMonthlySurplusData = z.infer<typeof KpiMonthlySurplusDataSchema>;
export type KpiSavingsRateData = z.infer<typeof KpiSavingsRateDataSchema>;
export type KpiMonthBurnRateData = z.infer<typeof KpiMonthBurnRateDataSchema>;
export type KpiCcDebtData = z.infer<typeof KpiCcDebtDataSchema>;
export type KpiCardItem = z.infer<typeof KpiCardItemSchema>;
export type KpiCardsPayload = z.infer<typeof KpiCardsPayloadSchema>;
