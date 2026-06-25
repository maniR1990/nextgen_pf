export const KPI_CARD_TYPE = {
  CASH_RUNWAY: 'cash-runway',
  BANK_CASH: 'bank-cash',
  MONTHLY_SURPLUS: 'monthly-surplus',
  SAVINGS_RATE: 'savings-rate',
  MONTH_BURN_RATE: 'month-burn-rate',
  CC_DEBT: 'cc-debt',
} as const;

export type KpiCardType = (typeof KPI_CARD_TYPE)[keyof typeof KPI_CARD_TYPE];

export const KPI_CARD_TYPE_VALUES = Object.values(KPI_CARD_TYPE);

export const KPI_DEFAULT_LOCALE = 'en-IN';
export const KPI_DEFAULT_CURRENCY = 'INR';

export const KPI_CARD_DENSITY = {
  COMFORTABLE: 'comfortable',
  COMPACT: 'compact',
} as const;

export type KpiCardDensity = (typeof KPI_CARD_DENSITY)[keyof typeof KPI_CARD_DENSITY];

/** Grid column span per card type on sm+ (wide cards span 2 of 3 on desktop). */
export const KPI_CARD_GRID_SPAN: Record<KpiCardType, 1 | 2> = {
  [KPI_CARD_TYPE.CASH_RUNWAY]: 2,
  [KPI_CARD_TYPE.BANK_CASH]: 1,
  [KPI_CARD_TYPE.MONTHLY_SURPLUS]: 2,
  [KPI_CARD_TYPE.SAVINGS_RATE]: 1,
  [KPI_CARD_TYPE.MONTH_BURN_RATE]: 2,
  [KPI_CARD_TYPE.CC_DEBT]: 1,
};
