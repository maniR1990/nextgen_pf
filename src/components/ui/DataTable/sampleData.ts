import { parseDataTableColumns } from './columnSchema';
import columnJson from './sampleColumns.json';
import type { DataTableColumnDef } from './types';

export type TransactionRow = {
  id: string;
  transaction: string;
  transactionIcon: 'cart' | 'briefcase' | 'tv' | 'zap';
  category: string;
  date: string;
  amount: number;
  status: string;
};

export const TRANSACTION_COLUMNS = parseDataTableColumns(
  columnJson,
) as DataTableColumnDef<TransactionRow>[];

export const TRANSACTION_ROWS: TransactionRow[] = [
  {
    id: '1',
    transaction: 'Grocery Store',
    transactionIcon: 'cart',
    category: 'Food',
    date: 'Jun 10, 2026',
    amount: -84.2,
    status: 'Completed',
  },
  {
    id: '2',
    transaction: 'Salary Deposit',
    transactionIcon: 'briefcase',
    category: 'Income',
    date: 'Jun 9, 2026',
    amount: 4100,
    status: 'Completed',
  },
  {
    id: '3',
    transaction: 'Netflix',
    transactionIcon: 'tv',
    category: 'Subscription',
    date: 'Jun 8, 2026',
    amount: -15.99,
    status: 'Pending',
  },
  {
    id: '4',
    transaction: 'Electricity',
    transactionIcon: 'zap',
    category: 'Utilities',
    date: 'Jun 7, 2026',
    amount: -112.45,
    status: 'Failed',
  },
  ...Array.from({ length: 16 }).map((_, index) => ({
    id: `gen-${index + 5}`,
    transaction: `Generated Transaction ${index + 5}`,
    transactionIcon: 'cart' as const,
    category: index % 2 === 0 ? 'Food' : 'Utilities',
    date: 'Jun 1, 2026',
    amount: index % 3 === 0 ? 25 : -25,
    status: index % 4 === 0 ? 'Pending' : 'Completed',
  })),
];
