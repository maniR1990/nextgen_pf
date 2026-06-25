import type { DataTableColumnDef, DataTableSortState } from './types';

export function getCellValue<T extends Record<string, unknown>>(
  row: T,
  column: DataTableColumnDef<T>,
): unknown {
  const field = column.accessor ?? column.key;
  return row[field];
}

export function getSortableValue(value: unknown): string | number {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return String(value).toLowerCase();
}

export function filterRows<T extends Record<string, unknown>>(
  rows: T[],
  columns: DataTableColumnDef<T>[],
  globalSearch: string,
  columnFilters: Record<string, string>,
): T[] {
  const query = globalSearch.trim().toLowerCase();

  return rows.filter((row) => {
    const matchesGlobal =
      !query ||
      columns.some((column) => {
        const value = getCellValue(row, column);
        return String(value ?? '')
          .toLowerCase()
          .includes(query);
      });

    if (!matchesGlobal) return false;

    return columns.every((column) => {
      const filterValue = columnFilters[column.key];
      if (!filterValue) return true;
      const cell = getCellValue(row, column);
      return String(cell ?? '') === filterValue;
    });
  });
}

export function sortRows<T extends Record<string, unknown>>(
  rows: T[],
  columns: DataTableColumnDef<T>[],
  sort: DataTableSortState | null,
): T[] {
  if (!sort) return rows;

  const column = columns.find((col) => col.key === sort.key);
  if (!column) return rows;

  const direction = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => {
    const aVal = getSortableValue(getCellValue(a, column));
    const bVal = getSortableValue(getCellValue(b, column));

    if (aVal < bVal) return -1 * direction;
    if (aVal > bVal) return 1 * direction;
    return 0;
  });
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    rows: rows.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    total,
    startIndex: total === 0 ? 0 : start + 1,
    endIndex: Math.min(start + pageSize, total),
  };
}

export function reorderColumns<T extends Record<string, unknown>>(
  columns: DataTableColumnDef<T>[],
  order: string[],
): DataTableColumnDef<T>[] {
  const map = new Map(columns.map((col) => [col.key, col]));
  const ordered = order.map((key) => map.get(key)).filter(Boolean) as DataTableColumnDef<T>[];
  const remaining = columns.filter((col) => !order.includes(col.key));
  return [...ordered, ...remaining];
}

export function visibleColumns<T extends Record<string, unknown>>(
  columns: DataTableColumnDef<T>[],
  hiddenKeys: string[],
) {
  return columns.filter((col) => !hiddenKeys.includes(col.key) && !col.hidden);
}
