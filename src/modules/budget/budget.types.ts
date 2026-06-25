import type {
  BudgetEntryTag,
  BudgetLineKind,
  BudgetSectionVariant,
} from '@prisma/client';

export interface BudgetLineRecord {
  id: string;
  userId: string;
  parentId: string | null;
  title: string;
  kind: BudgetLineKind;
  variant: BudgetSectionVariant | null;
  plannedMinor: number;
  spentMinor: number;
  sortOrder: number;
  tag: BudgetEntryTag | null;
  note: string | null;
  typeLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBudgetLineDto {
  parentId?: string | null;
  title: string;
  kind: BudgetLineKind;
  variant?: BudgetSectionVariant | null;
  plannedMinor?: number;
  spentMinor?: number;
  sortOrder?: number;
  tag?: BudgetEntryTag | null;
  note?: string | null;
  typeLabel?: string | null;
}

export interface UpdateBudgetLineDto {
  title?: string;
  plannedMinor?: number;
  spentMinor?: number;
  sortOrder?: number;
  tag?: BudgetEntryTag | null;
  note?: string | null;
  typeLabel?: string | null;
}

export interface BudgetLedgerMetrics {
  plannedMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percent: number;
}

export interface BudgetLedgerNode extends BudgetLedgerMetrics {
  id: string;
  title: string;
  kind: string;
  variant?: string | null;
  tag?: string | null;
  note?: string | null;
  typeLabel?: string | null;
  sortOrder: number;
  children?: BudgetLedgerNode[];
}

export interface BudgetSummaryRow extends BudgetLedgerMetrics {
  id: string;
  title: string;
  tone?: 'default' | 'success' | 'warning';
}

export interface BudgetLedgerPayload {
  rows: BudgetLedgerNode[];
  summaries: BudgetSummaryRow[];
}
