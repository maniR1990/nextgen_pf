'use client';

import {
  type ColumnDef,
  type ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import type { BudgetLedgerNodeJson } from './schemas';

export function useBudgetLedgerColumns(): ColumnDef<BudgetLedgerNodeJson>[] {
  return useMemo(
    () => [
      { id: 'category', header: 'CATEGORY', accessorKey: 'title' },
      { id: 'planned', header: 'PLANNED', accessorKey: 'plannedMinor' },
      { id: 'spent', header: 'SPENT', accessorKey: 'spentMinor' },
      { id: 'remaining', header: 'REMAINING', accessorKey: 'remainingMinor' },
      { id: 'percent', header: '%', accessorKey: 'percent' },
      { id: 'notes', header: 'TYPE / NOTES', accessorFn: (row) => row.typeLabel ?? row.note ?? '' },
    ],
    [],
  );
}

export interface UseBudgetLedgerTableOptions {
  rows: BudgetLedgerNodeJson[];
  defaultExpanded?: boolean;
}

export function useBudgetLedgerTable({
  rows,
  defaultExpanded = true,
}: UseBudgetLedgerTableOptions) {
  const columns = useBudgetLedgerColumns();
  const collectExpandedIds = (node: BudgetLedgerNodeJson): [string, boolean][] => {
    const entries: [string, boolean][] = [[node.id, true]];
    for (const child of node.children ?? []) {
      entries.push(...collectExpandedIds(child));
    }
    return entries;
  };

  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    defaultExpanded ? Object.fromEntries(rows.flatMap(collectExpandedIds)) : {},
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getRowId: (row) => row.id,
    getSubRows: (row) => row.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const visibleRows = table.getRowModel().rows;

  return { table, visibleRows, expanded, setExpanded };
}

export type BudgetTableRow = ReturnType<typeof useBudgetLedgerTable>['visibleRows'][number];
