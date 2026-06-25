'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DATA_TABLE_DEFAULT_PAGE_SIZE,
  DATA_TABLE_DENSITIES,
  dataTableStorageKey,
  type DataTableDensity,
} from '@/constants/dataTable';
import {
  filterRows,
  paginateRows,
  reorderColumns,
  sortRows,
  visibleColumns,
} from './dataTableUtils';
import type { DataTableColumnDef, DataTablePreferences, DataTableSortState } from './types';

function loadPreferences(tableId: string): Partial<DataTablePreferences> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(dataTableStorageKey(tableId));
    return raw ? (JSON.parse(raw) as Partial<DataTablePreferences>) : null;
  } catch {
    return null;
  }
}

function savePreferences(tableId: string, prefs: DataTablePreferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(dataTableStorageKey(tableId), JSON.stringify(prefs));
}

export interface UseDataTableStateOptions<T extends Record<string, unknown>> {
  tableId: string;
  columns: DataTableColumnDef<T>[];
  data: T[];
  pageSize?: number;
  persistPreferences?: boolean;
}

export function useDataTableState<T extends Record<string, unknown>>({
  tableId,
  columns,
  data,
  pageSize: initialPageSize = DATA_TABLE_DEFAULT_PAGE_SIZE,
  persistPreferences = true,
}: UseDataTableStateOptions<T>) {
  const saved = persistPreferences ? loadPreferences(tableId) : null;

  const [sort, setSort] = useState<DataTableSortState | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnOrder, setColumnOrder] = useState<string[]>(
    saved?.columnOrder ?? columns.map((col) => col.key),
  );
  const [hiddenColumns, setHiddenColumns] = useState<string[]>(saved?.hiddenColumns ?? []);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(saved?.columnWidths ?? {});
  const [density, setDensity] = useState<DataTableDensity>(
    saved?.density && DATA_TABLE_DENSITIES.includes(saved.density) ? saved.density : 'standard',
  );

  useEffect(() => {
    if (!persistPreferences) return;
    savePreferences(tableId, { columnOrder, hiddenColumns, columnWidths, density });
  }, [tableId, columnOrder, hiddenColumns, columnWidths, density, persistPreferences]);

  const orderedColumns = useMemo(
    () => reorderColumns(columns, columnOrder),
    [columns, columnOrder],
  );

  const displayColumns = useMemo(
    () => visibleColumns(orderedColumns, hiddenColumns),
    [orderedColumns, hiddenColumns],
  );

  const filtered = useMemo(
    () => filterRows(data, orderedColumns, globalSearch, columnFilters),
    [data, orderedColumns, globalSearch, columnFilters],
  );

  const sorted = useMemo(() => sortRows(filtered, orderedColumns, sort), [filtered, orderedColumns, sort]);

  const pagination = useMemo(
    () => paginateRows(sorted, page, pageSize),
    [sorted, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [globalSearch, columnFilters, pageSize, sort]);

  const toggleSort = useCallback((key: string) => {
    setSort((current) => {
      if (!current || current.key !== key) return { key, direction: 'asc' };
      if (current.direction === 'asc') return { key, direction: 'desc' };
      return null;
    });
  }, []);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllPageRows = useCallback(
    (ids: string[], checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => {
          if (checked) next.add(id);
          else next.delete(id);
        });
        return next;
      });
    },
    [],
  );

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const setColumnFilter = useCallback((key: string, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleColumnVisibility = useCallback((key: string) => {
    setHiddenColumns((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  }, []);

  const moveColumn = useCallback((key: string, direction: 'up' | 'down') => {
    setColumnOrder((prev) => {
      const index = prev.indexOf(key);
      if (index < 0) return prev;
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const setColumnWidth = useCallback((key: string, width: number) => {
    setColumnWidths((prev) => ({ ...prev, [key]: width }));
  }, []);

  const selectedRows = useMemo(
    () => data.filter((row) => selectedIds.has(String(row.id))),
    [data, selectedIds],
  );

  return {
    sort,
    globalSearch,
    setGlobalSearch,
    columnFilters,
    setColumnFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedIds,
    selectedRows,
    toggleRow,
    toggleAllPageRows,
    clearSelection,
    toggleSort,
    displayColumns,
    orderedColumns,
    columnOrder,
    hiddenColumns,
    toggleColumnVisibility,
    moveColumn,
    columnWidths,
    setColumnWidth,
    density,
    setDensity,
    pagination,
  };
}
