import type { TxType } from '@/constants/finance';

export const TRANSACTION_FILTER_ALL = 'all' as const;

export type TransactionFilterChip =
  | typeof TRANSACTION_FILTER_ALL
  | 'expense'
  | 'income'
  | 'investment'
  | 'transfer';

export const TRANSACTION_FILTER_CHIPS: ReadonlyArray<{
  id: TransactionFilterChip;
  label: string;
  types?: TxType[];
}> = [
  { id: TRANSACTION_FILTER_ALL, label: 'All' },
  { id: 'expense', label: 'Expense', types: ['EXPENSE'] },
  { id: 'income', label: 'Income', types: ['INCOME'] },
  { id: 'investment', label: 'Investment', types: ['INVESTMENT'] },
  { id: 'transfer', label: 'Transfer', types: ['TRANSFER', 'ATM_WITHDRAWAL'] },
];

export const TRANSACTION_SORT = {
  DATE_DESC: 'date_desc',
  DATE_ASC: 'date_asc',
} as const;

export type TransactionSort = (typeof TRANSACTION_SORT)[keyof typeof TRANSACTION_SORT];

export const TRANSACTION_DEFAULT_SORT: TransactionSort = TRANSACTION_SORT.DATE_DESC;

export const TRANSACTION_DEFAULT_LIMIT = 20;

export const TRANSACTIONS_QUERY_KEY = 'transactions' as const;

export const PAYMENT_SOURCES_QUERY_KEY = 'payment-sources' as const;

export function chipToApiType(chip: TransactionFilterChip): TxType | undefined {
  const entry = TRANSACTION_FILTER_CHIPS.find((c) => c.id === chip);
  if (!entry?.types || entry.types.length !== 1) return undefined;
  return entry.types[0];
}

export function chipToApiTypes(chip: TransactionFilterChip): TxType[] | undefined {
  if (chip === TRANSACTION_FILTER_ALL) return undefined;
  const entry = TRANSACTION_FILTER_CHIPS.find((c) => c.id === chip);
  return entry?.types;
}
