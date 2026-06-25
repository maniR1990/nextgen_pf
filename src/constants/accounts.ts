import type { AccountGroupType, AccountType } from '@prisma/client';

/** Balance-sheet side for net-worth rollup */
export type AccountSide = 'asset' | 'liability';

/** Taxonomy bucket within assets (or liabilities) */
export type AccountTaxonomyGroup =
  | 'banking'
  | 'cash'
  | 'wallets'
  | 'investment'
  | 'alternate'
  | 'rewards'
  | 'liabilities';

export interface AccountTypeMeta {
  slug: string;
  name: string;
  side: AccountSide;
  group: AccountTaxonomyGroup;
  groupLabel: string;
  wealthRole?: string;
  keyMetric?: string;
  strategy?: string;
  taxBenefit?: boolean;
  codePrefix: string;
}

/**
 * All 41 account types — assets (what you own) + liabilities (what you owe).
 * Net Worth = Σ assets − Σ liabilities (respecting `isExcludeNetWorth` on Account).
 */
export const ACCOUNT_TYPE_META = {
  // ── ASSETS: Banking ───────────────────────────────────────────────────────
  BANK_SALARY: {
    slug: 'bank_salary',
    name: 'Salary Account',
    side: 'asset',
    group: 'banking',
    groupLabel: 'Banking',
    wealthRole: 'Primary income entry point',
    codePrefix: 'SAL',
  },
  BANK_SAVINGS: {
    slug: 'bank_savings',
    name: 'Savings Account',
    side: 'asset',
    group: 'banking',
    groupLabel: 'Banking',
    wealthRole: 'Emergency fund + operations base',
    codePrefix: 'SAV',
  },
  BANK_CURRENT: {
    slug: 'bank_current',
    name: 'Current Account',
    side: 'asset',
    group: 'banking',
    groupLabel: 'Banking',
    wealthRole: 'Business / freelance cash flow',
    codePrefix: 'CUR',
  },
  BANK_NRE: {
    slug: 'bank_nre',
    name: 'NRE / NRO Account',
    side: 'asset',
    group: 'banking',
    groupLabel: 'Banking',
    wealthRole: 'NRI foreign income — tax-free',
    codePrefix: 'NRE',
  },
  BANK_JAN_DHAN: {
    slug: 'bank_jan_dhan',
    name: 'Jan Dhan Account',
    side: 'asset',
    group: 'banking',
    groupLabel: 'Banking',
    wealthRole: 'Zero-balance; gateway to banking',
    codePrefix: 'JDY',
  },

  // ── ASSETS: Cash ──────────────────────────────────────────────────────────
  CASH_ENVELOPE: {
    slug: 'cash_envelope',
    name: 'Cash Envelope',
    side: 'asset',
    group: 'cash',
    groupLabel: 'Cash',
    wealthRole: 'Physical envelope budgeting',
    codePrefix: 'ENV',
  },
  CASH_ATM: {
    slug: 'cash_atm',
    name: 'ATM Withdrawn Cash',
    side: 'asset',
    group: 'cash',
    groupLabel: 'Cash',
    wealthRole: 'Unallocated cash to track',
    codePrefix: 'ATM',
  },

  // ── ASSETS: Wallets ─────────────────────────────────────────────────────────
  WALLET_DIGITAL: {
    slug: 'wallet_digital',
    name: 'Digital Wallet',
    side: 'asset',
    group: 'wallets',
    groupLabel: 'Wallets',
    wealthRole: 'PhonePe, Paytm, GPay balance',
    codePrefix: 'DWL',
  },
  WALLET_UPI: {
    slug: 'wallet_upi',
    name: 'UPI Linked Account',
    side: 'asset',
    group: 'wallets',
    groupLabel: 'Wallets',
    wealthRole: 'Mirrors linked bank balance',
    codePrefix: 'UPI',
  },
  WALLET_GIFT: {
    slug: 'wallet_gift',
    name: 'Gift Card',
    side: 'asset',
    group: 'wallets',
    groupLabel: 'Wallets',
    wealthRole: 'Prepaid store value',
    codePrefix: 'GFT',
  },

  // ── ASSETS: Investment ──────────────────────────────────────────────────────
  INV_PPF: {
    slug: 'inv_ppf',
    name: 'PPF Account',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'Tax-free 7.1% — 15yr lock-in',
    taxBenefit: true,
    codePrefix: 'PPF',
  },
  INV_EPF: {
    slug: 'inv_epf',
    name: 'EPF Account',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: '8.15% — employer match free money',
    taxBenefit: true,
    codePrefix: 'EPF',
  },
  INV_NPS_T1: {
    slug: 'inv_nps_t1',
    name: 'NPS Tier 1',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'Extra ₹50K under 80CCD(1B)',
    taxBenefit: true,
    codePrefix: 'N1',
  },
  INV_NPS_T2: {
    slug: 'inv_nps_t2',
    name: 'NPS Tier 2',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'Liquid voluntary top-up',
    codePrefix: 'N2',
  },
  INV_ELSS: {
    slug: 'inv_elss',
    name: 'ELSS Fund',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: '80C + equity returns; 3yr lock',
    taxBenefit: true,
    codePrefix: 'ELS',
  },
  INV_MF_EQUITY: {
    slug: 'inv_mf_equity',
    name: 'Equity Mutual Fund',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'SIP — core wealth engine',
    codePrefix: 'EQ',
  },
  INV_MF_DEBT: {
    slug: 'inv_mf_debt',
    name: 'Debt Mutual Fund',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'Stable returns; emergency tier 2',
    codePrefix: 'DBT',
  },
  INV_MF_LIQUID: {
    slug: 'inv_mf_liquid',
    name: 'Liquid / Overnight Fund',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'Emergency fund tier 1 (redeems in 1 day)',
    codePrefix: 'LIQ',
  },
  INV_FD: {
    slug: 'inv_fd',
    name: 'Fixed Deposit',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'Emergency fund tier 2; laddering',
    codePrefix: 'FD',
  },
  INV_RD: {
    slug: 'inv_rd',
    name: 'Recurring Deposit',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'Forced savings for short goals',
    codePrefix: 'RD',
  },
  INV_SSY: {
    slug: 'inv_ssy',
    name: 'Sukanya Samriddhi (SSY)',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: '8.2% tax-free — daughter education',
    taxBenefit: true,
    codePrefix: 'SSY',
  },
  INV_STOCKS: {
    slug: 'inv_stocks',
    name: 'Direct Equity / Stocks',
    side: 'asset',
    group: 'investment',
    groupLabel: 'Investment',
    wealthRole: 'Long-term wealth compounding',
    codePrefix: 'STK',
  },

  // ── ASSETS: Alternate ───────────────────────────────────────────────────────
  GOLD_PHYSICAL: {
    slug: 'gold_physical',
    name: 'Physical Gold',
    side: 'asset',
    group: 'alternate',
    groupLabel: 'Alternate',
    wealthRole: 'Inflation hedge; market value track',
    codePrefix: 'GPH',
  },
  GOLD_SGB: {
    slug: 'gold_sgb',
    name: 'Sovereign Gold Bond',
    side: 'asset',
    group: 'alternate',
    groupLabel: 'Alternate',
    wealthRole: '2.5% interest + gold appreciation',
    taxBenefit: true,
    codePrefix: 'SGB',
  },
  GOLD_DIGITAL: {
    slug: 'gold_digital',
    name: 'Digital Gold',
    side: 'asset',
    group: 'alternate',
    groupLabel: 'Alternate',
    wealthRole: 'Paytm / MMTC-PAMP gold',
    codePrefix: 'GDG',
  },
  REAL_ESTATE: {
    slug: 'real_estate',
    name: 'Real Estate',
    side: 'asset',
    group: 'alternate',
    groupLabel: 'Alternate',
    wealthRole: 'Property market value',
    codePrefix: 'RE',
  },
  CHIT_FUND: {
    slug: 'chit_fund',
    name: 'Chit Fund',
    side: 'asset',
    group: 'alternate',
    groupLabel: 'Alternate',
    wealthRole: 'Rotating savings club — track carefully',
    codePrefix: 'CHT',
  },
  ESOP: {
    slug: 'esop',
    name: 'ESOP / Stock Options',
    side: 'asset',
    group: 'alternate',
    groupLabel: 'Alternate',
    wealthRole: 'Vested value tracking',
    codePrefix: 'ESO',
  },

  // ── ASSETS: Rewards ─────────────────────────────────────────────────────────
  REWARDS_POINTS: {
    slug: 'rewards_points',
    name: 'Reward Points',
    side: 'asset',
    group: 'rewards',
    groupLabel: 'Rewards',
    wealthRole: 'Cash-equivalent redemption value',
    codePrefix: 'PTS',
  },
  CASHBACK_BALANCE: {
    slug: 'cashback_balance',
    name: 'Cashback Balance',
    side: 'asset',
    group: 'rewards',
    groupLabel: 'Rewards',
    wealthRole: 'Earned cashback pending redemption',
    codePrefix: 'CBK',
  },
  STORE_CREDIT: {
    slug: 'store_credit',
    name: 'Store Credits / Coupons',
    side: 'asset',
    group: 'rewards',
    groupLabel: 'Rewards',
    wealthRole: 'Platform credits with expiry',
    codePrefix: 'STC',
  },

  // ── LIABILITIES ─────────────────────────────────────────────────────────────
  LOAN_HOME: {
    slug: 'loan_home',
    name: 'Home Loan',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'EMI + Interest rate',
    strategy: 'Prepay principal every year',
    codePrefix: 'HLN',
  },
  LOAN_CAR: {
    slug: 'loan_car',
    name: 'Car / Vehicle Loan',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'Remaining EMIs',
    strategy: 'Foreclose early if lump sum available',
    codePrefix: 'CAR',
  },
  LOAN_PERSONAL: {
    slug: 'loan_personal',
    name: 'Personal Loan',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'Interest rate (18-24%)',
    strategy: 'Highest priority to eliminate first',
    codePrefix: 'PLN',
  },
  LOAN_EDUCATION: {
    slug: 'loan_education',
    name: 'Education Loan',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'Moratorium period',
    strategy: '80E tax deduction on interest',
    taxBenefit: true,
    codePrefix: 'EDU',
  },
  LOAN_GOLD: {
    slug: 'loan_gold',
    name: 'Gold Loan',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'LTV ratio + rate',
    strategy: 'Cheaper than personal loan',
    codePrefix: 'GLN',
  },
  CREDIT_CARD: {
    slug: 'credit_card',
    name: 'Credit Card Outstanding',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'Utilisation % (keep <30%)',
    strategy: '36-42% APR — pay full every month',
    codePrefix: 'CC',
  },
  BNPL: {
    slug: 'bnpl',
    name: 'Buy Now Pay Later',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'Repayment schedule',
    strategy: 'Treat as soft debt; clear monthly',
    codePrefix: 'BNP',
  },
  LOAN_INFORMAL: {
    slug: 'loan_informal',
    name: 'Family / Informal Borrowing',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'Agreed repayment',
    strategy: 'Document even when interest-free',
    codePrefix: 'INF',
  },
  LOAN_OVERDRAFT: {
    slug: 'loan_overdraft',
    name: 'Overdraft Facility',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'Limit used',
    strategy: 'Emergency only; clear immediately',
    codePrefix: 'OD',
  },
  INSURANCE_PREMIUM_DUE: {
    slug: 'insurance_premium_due',
    name: 'Insurance Premium Due',
    side: 'liability',
    group: 'liabilities',
    groupLabel: 'Liabilities',
    keyMetric: 'Due date + penalty',
    strategy: 'Never lapse term or health cover',
    codePrefix: 'INS',
  },
} as const satisfies Record<AccountType, AccountTypeMeta>;

/** All Prisma AccountType values (41 types) */
export const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_META) as AccountType[];

export const ACCOUNT_STATUSES = ['ACTIVE', 'INACTIVE', 'CLOSED', 'FROZEN'] as const;

export const ACCOUNT_SORT_OPTIONS = [
  'name_asc',
  'name_desc',
  'balance_asc',
  'balance_desc',
  'type_asc',
  'created_desc',
] as const;

export type AccountSort = (typeof ACCOUNT_SORT_OPTIONS)[number];

/** Short code segment per account type for auto-generated `code` field */
export const ACCOUNT_TYPE_CODE_PREFIX = Object.fromEntries(
  Object.entries(ACCOUNT_TYPE_META).map(([type, meta]) => [type, meta.codePrefix]),
) as Record<AccountType, string>;

export const ACCOUNT_ASSET_TYPES = ACCOUNT_TYPES.filter(
  (type) => ACCOUNT_TYPE_META[type].side === 'asset',
);

export const ACCOUNT_LIABILITY_TYPES = ACCOUNT_TYPES.filter(
  (type) => ACCOUNT_TYPE_META[type].side === 'liability',
);

export const ACCOUNT_TAX_BENEFIT_TYPES = ACCOUNT_TYPES.filter(
  (type) => ACCOUNT_TYPE_META[type].taxBenefit === true,
);

export const ACCOUNT_TAXONOMY_GROUPS = [
  { slug: 'banking', label: 'Banking', side: 'asset' as const },
  { slug: 'cash', label: 'Cash', side: 'asset' as const },
  { slug: 'wallets', label: 'Wallets', side: 'asset' as const },
  { slug: 'investment', label: 'Investment', side: 'asset' as const },
  { slug: 'alternate', label: 'Alternate', side: 'asset' as const },
  { slug: 'rewards', label: 'Rewards', side: 'asset' as const },
  { slug: 'liabilities', label: 'Liabilities', side: 'liability' as const },
] as const;

/** Recommended AccountGroup seeds — map taxonomy group → net-worth bucket */
export const DEFAULT_ACCOUNT_GROUP_TEMPLATES: ReadonlyArray<{
  name: string;
  slug: string;
  type: AccountGroupType;
  order: number;
  taxonomyGroup: AccountTaxonomyGroup;
}> = [
  { name: 'Banking', slug: 'banking', type: 'ASSET', order: 0, taxonomyGroup: 'banking' },
  { name: 'Cash', slug: 'cash', type: 'ASSET', order: 1, taxonomyGroup: 'cash' },
  { name: 'Wallets', slug: 'wallets', type: 'ASSET', order: 2, taxonomyGroup: 'wallets' },
  { name: 'Investment', slug: 'investment', type: 'ASSET', order: 3, taxonomyGroup: 'investment' },
  { name: 'Alternate', slug: 'alternate', type: 'ASSET', order: 4, taxonomyGroup: 'alternate' },
  { name: 'Rewards', slug: 'rewards', type: 'ASSET', order: 5, taxonomyGroup: 'rewards' },
  { name: 'Liabilities', slug: 'liabilities', type: 'LIABILITY', order: 6, taxonomyGroup: 'liabilities' },
];

/** Map v1 legacy PaymentSource types → v2 AccountType */
export const LEGACY_ACCOUNT_TYPE_MAP: Record<string, AccountType> = {
  BANK_SALARY: 'BANK_SALARY',
  BANK_SAVINGS: 'BANK_SAVINGS',
  BANK_CURRENT: 'BANK_CURRENT',
  BANK_NRE: 'BANK_NRE',
  CREDIT_CARD: 'CREDIT_CARD',
  CASH_WALLET: 'CASH_ENVELOPE',
  ATM_CASH: 'CASH_ATM',
  DIGITAL_WALLET: 'WALLET_DIGITAL',
  UPI: 'WALLET_UPI',
  GIFT_CARD: 'WALLET_GIFT',
  CASH_GIFT: 'WALLET_GIFT',
  COUPON_WALLET: 'STORE_CREDIT',
  POINTS_WALLET: 'REWARDS_POINTS',
  STORE_CREDIT: 'STORE_CREDIT',
  INVESTMENT_ACC: 'INV_STOCKS',
  INVESTMENT_FD: 'INV_FD',
  INVESTMENT_MF: 'INV_MF_EQUITY',
  INVESTMENT_PPF: 'INV_PPF',
  INVESTMENT_NPS: 'INV_NPS_T1',
  INVESTMENT_SUKANYA: 'INV_SSY',
  SUKANYA: 'INV_SSY',
  FD: 'INV_FD',
  PPF: 'INV_PPF',
  NPS: 'INV_NPS_T1',
  LOAN_HOME: 'LOAN_HOME',
  LOAN_PERSONAL: 'LOAN_PERSONAL',
  LOAN_VEHICLE: 'LOAN_CAR',
  LOAN_EDUCATION: 'LOAN_EDUCATION',
  LOAN_OTHER: 'LOAN_INFORMAL',
};

export function getAccountTypeMeta(type: AccountType): AccountTypeMeta {
  return ACCOUNT_TYPE_META[type];
}

export function getAccountTypeBySlug(slug: string): AccountType | undefined {
  return ACCOUNT_TYPES.find((type) => ACCOUNT_TYPE_META[type].slug === slug);
}

export function isLiabilityAccountType(type: AccountType): boolean {
  return ACCOUNT_TYPE_META[type].side === 'liability';
}

export function isAssetAccountType(type: AccountType): boolean {
  return ACCOUNT_TYPE_META[type].side === 'asset';
}

export function getDefaultGroupSlugForType(type: AccountType): string {
  return ACCOUNT_TYPE_META[type].group;
}

export const BALANCE_ADJUSTMENT_MERCHANT = 'Balance Adjustment';
export const RECENT_ACTIVITY_LIMIT = 10;
export const UPCOMING_EVENTS_DAYS = 90;

/** Credit types where utilisation % health metric applies */
export const UTILISATION_ACCOUNT_TYPES: readonly AccountType[] = ['CREDIT_CARD', 'BNPL', 'LOAN_OVERDRAFT'];
