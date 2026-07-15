import type { TransactionSort } from '@/constants/transactions';

const TRANSACTIONS_ROOT = 'transactions';

export interface TransactionListFilters {
  year: number;
  month: number;
  typeChip: string;
  paymentSourceId?: string;
  status?: string;
  search?: string;
  sort: TransactionSort;
}

export const queryKeys = {
  transactions: {
    all: [TRANSACTIONS_ROOT] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (filters: TransactionListFilters) =>
      [...queryKeys.transactions.lists(), filters] as const,
    detail: (id: string) => [TRANSACTIONS_ROOT, 'detail', id] as const,
    summaries: () => [...queryKeys.transactions.all, 'summary'] as const,
    summary: (year: number, month: number) =>
      [...queryKeys.transactions.summaries(), year, month] as const,
  },
  paymentSources: {
    all: ['payment-sources'] as const,
    list: () => [...queryKeys.paymentSources.all, 'list'] as const,
  },
  appHeader: {
    all: ['app-header-data'] as const,
    summary: () => [...queryKeys.appHeader.all, 'summary'] as const,
  },
  categories: {
    all: ['categories'] as const,
    tree: () => [...queryKeys.categories.all, 'tree'] as const,
  },
  formOptions: {
    all: ['form-options'] as const,
    categories: () => [...queryKeys.formOptions.all, 'categories'] as const,
    sources: () => [...queryKeys.formOptions.all, 'payment-sources'] as const,
  },
  accounts: {
    all: ['accounts'] as const,
    list: () => [...queryKeys.accounts.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.accounts.all, 'detail', id] as const,
  },
  funds: {
    all: ['funds'] as const,
    list: () => [...queryKeys.funds.all, 'list'] as const,
    summary: () => [...queryKeys.funds.all, 'summary'] as const,
  },
  fundGroups: {
    all: ['fund-groups'] as const,
    list: () => [...queryKeys.fundGroups.all, 'list'] as const,
  },
  reports: {
    all: ['reports'] as const,
    kpi: (year: number, month: number) => [...queryKeys.reports.all, 'kpi', year, month] as const,
  },
  budget: {
    all: ['budget'] as const,
    summary: (year: number, month: number) => ['budget', 'summary', year, month] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    calendar: (year: number, month: number) =>
      [...queryKeys.dashboard.all, 'calendar', year, month] as const,
  },
};

export { TRANSACTIONS_ROOT };
