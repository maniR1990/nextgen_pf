/** Empty state layout size presets */
export const EMPTY_STATE_SIZES = ['sm', 'md', 'lg'] as const;

export type EmptyStateSize = (typeof EMPTY_STATE_SIZES)[number];

export const EMPTY_STATE_DEFAULT_SIZE: EmptyStateSize = 'md';

export const EMPTY_STATE_DEFAULT_ICON_TONE = 'muted' as const;

/** Data table empty copy */
export const DATA_TABLE_EMPTY_TITLE = 'No records found';

export const DATA_TABLE_EMPTY_DESCRIPTION = 'Try adjusting your search or filters.';

/** Storybook / demo copy */
export const EMPTY_STATE_DEMO_TRANSACTIONS_TITLE = 'No transactions yet';

export const EMPTY_STATE_DEMO_TRANSACTIONS_DESCRIPTION =
  'Start tracking your spending by adding your first transaction.';

export const EMPTY_STATE_DEMO_TRANSACTIONS_ACTION = '+ Add Transaction';
