export const FUND_PURPOSES = [
  'EMERGENCY',
  'OPS',
  'GOAL',
  'TAX',
  'INSURANCE',
  'SINKING',
  'INVESTMENT',
  'WEALTH',
] as const;

export const FUND_ALLOCATION_TYPES = ['PERCENTAGE', 'FIXED'] as const;

export const FUND_SORT_OPTIONS = [
  'order_asc',
  'order_desc',
  'name_asc',
  'name_desc',
  'fill_asc',
  'fill_desc',
  'created_desc',
] as const;

export type FundSort = (typeof FUND_SORT_OPTIONS)[number];

export const FUND_HEALTH_THRESHOLDS = {
  HEALTHY: 100,
  OK: 50,
} as const;
