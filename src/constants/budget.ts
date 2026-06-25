export const BUDGET_LINE_KIND = {
  SECTION: 'section',
  GROUP: 'group',
  LINE: 'line',
  SUMMARY: 'summary',
} as const;

export type BudgetLineKindValue = (typeof BUDGET_LINE_KIND)[keyof typeof BUDGET_LINE_KIND];

export const BUDGET_ENTRY_TAG = {
  MANUAL: 'manual',
  AUTO: 'auto',
} as const;

export type BudgetEntryTagValue = (typeof BUDGET_ENTRY_TAG)[keyof typeof BUDGET_ENTRY_TAG];

export const BUDGET_SECTION_VARIANT = {
  INCOME: 'income',
  HOUSEHOLD: 'household',
  INSURANCE: 'insurance',
  SINKING: 'sinking',
  SUBSCRIPTIONS: 'subscriptions',
  INVESTMENTS: 'investments',
  EMIS: 'emis',
  UNPLANNED: 'unplanned',
} as const;

export type BudgetSectionVariantValue =
  (typeof BUDGET_SECTION_VARIANT)[keyof typeof BUDGET_SECTION_VARIANT];

export const BUDGET_SUMMARY_ID = {
  ESSENTIAL_TOTAL: 'summary-essential-total',
  INVESTMENTS_TOTAL: 'summary-investments-total',
  MONTHLY_OUTFLOW: 'summary-monthly-outflow',
  SURPLUS: 'summary-surplus',
} as const;

/** Variants rolled into "Essential + Protection + Future Funds" summary */
export const BUDGET_ESSENTIAL_VARIANTS: BudgetSectionVariantValue[] = [
  BUDGET_SECTION_VARIANT.HOUSEHOLD,
  BUDGET_SECTION_VARIANT.INSURANCE,
  BUDGET_SECTION_VARIANT.SINKING,
];

export const BUDGET_API_PATH = '/api/budget';

export const BUDGET_QUERY_KEY = ['budget', 'ledger'] as const;
