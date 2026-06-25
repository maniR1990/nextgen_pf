import type { ReactNode } from 'react';
import type { BadgeVariant } from '@/components/ui/Badge';
import type { DataTableDensity } from '@/constants/dataTable';

export type DataTableColumnType = 'text' | 'date' | 'amount' | 'badge' | 'transaction';

export type SortDirection = 'asc' | 'desc';

export interface DataTableSortState {
  key: string;
  direction: SortDirection;
}

/** JSON-serializable column definition */
export interface DataTableColumnDef<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  header: string;
  type?: DataTableColumnType;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { label: string; value: string }[];
  width?: number;
  minWidth?: number;
  frozen?: boolean;
  hidden?: boolean;
  align?: 'left' | 'right';
  /** Row field for badge variant when type is badge */
  badgeVariantKey?: keyof T & string;
  /** Row field for Lucide icon name when type is transaction */
  iconKey?: keyof T & string;
  accessor?: keyof T & string;
  render?: (row: T) => ReactNode;
}

export interface DataTableRowAction<T> {
  id: string;
  label: string;
  onAction: (row: T) => void;
  destructive?: boolean;
}

export interface DataTableBulkAction<T> {
  id: string;
  label: string;
  onAction: (rows: T[]) => void;
}

export interface DataTablePreferences {
  columnOrder: string[];
  hiddenColumns: string[];
  columnWidths: Record<string, number>;
  density: DataTableDensity;
}

export interface DataTableEmptyState {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export type BadgeVariantResolver = (value: string, row: Record<string, unknown>) => BadgeVariant;
