export const CATEGORY_FLOW_TYPES = ['INCOME', 'EXPENSE', 'INVESTMENT', 'TRANSFER'] as const;

export const CATEGORY_FLOW_TYPE_SLUGS = ['income', 'expense', 'investment', 'transfer'] as const;

export type CategoryFlowTypeSlug = (typeof CATEGORY_FLOW_TYPE_SLUGS)[number];

export const CATEGORY_MAX_LEVEL = 3;

export const MATCH_RULE_FIELDS = ['PAYEE', 'DESCRIPTION', 'AMOUNT'] as const;

export const MATCH_RULE_OPERATORS = [
  'CONTAINS',
  'EQUALS',
  'STARTS_WITH',
  'REGEX',
  'BETWEEN',
] as const;

export const CATEGORY_SORT_OPTIONS = [
  'order_asc',
  'name_asc',
  'name_desc',
  'created_desc',
] as const;

export type CategorySort = (typeof CATEGORY_SORT_OPTIONS)[number];

export const CATEGORY_STATS_TREND_MONTHS = 6;

export const CATEGORY_TOP_TRANSACTIONS_LIMIT = 10;

/** Map API ?type= slug → Prisma CategoryFlowType */
export function toCategoryFlowType(
  slug: CategoryFlowTypeSlug,
): (typeof CATEGORY_FLOW_TYPES)[number] {
  const map = {
    income: 'INCOME',
    expense: 'EXPENSE',
    investment: 'INVESTMENT',
    transfer: 'TRANSFER',
  } as const;
  return map[slug];
}

export function fromCategoryFlowType(
  type: (typeof CATEGORY_FLOW_TYPES)[number],
): CategoryFlowTypeSlug {
  return type.toLowerCase() as CategoryFlowTypeSlug;
}
