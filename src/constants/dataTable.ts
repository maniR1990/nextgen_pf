/** Data table density padding presets */
export const DATA_TABLE_DENSITIES = ['comfortable', 'standard', 'compact'] as const;

export type DataTableDensity = (typeof DATA_TABLE_DENSITIES)[number];

export const DATA_TABLE_PAGE_SIZES = [10, 25, 50, 100] as const;

export const DATA_TABLE_DEFAULT_PAGE_SIZE = 10;

export const DATA_TABLE_STORAGE_PREFIX = 'data-table-prefs';

export function dataTableStorageKey(tableId: string) {
  return `${DATA_TABLE_STORAGE_PREFIX}:${tableId}`;
}
