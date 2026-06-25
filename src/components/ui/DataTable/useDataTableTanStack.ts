'use client';

/**
 * TanStack Table migration stub — does NOT replace the custom DataTable.
 * Wire up when column virtualization or headless table features are required.
 *
 * @example
 * const table = useDataTableTanStack({ data, columns });
 * // table.getRowModel().rows — feed into existing row renderers
 */
import { type ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table';

export interface UseDataTableTanStackOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
}

export function useDataTableTanStack<TData>({ data, columns }: UseDataTableTanStackOptions<TData>) {
  return useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
}
