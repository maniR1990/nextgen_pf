import { describe, expect, it } from 'vitest';
import { filterRows, paginateRows, sortRows } from './dataTableUtils';
import type { DataTableColumnDef } from './types';

type Row = { id: string; name: string; amount: number; status: string };

const columns: DataTableColumnDef<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'amount', header: 'Amount', type: 'amount', sortable: true },
  { key: 'status', header: 'Status', filterable: true },
];

const rows: Row[] = [
  { id: '1', name: 'Alpha', amount: 10, status: 'Completed' },
  { id: '2', name: 'Beta', amount: -5, status: 'Pending' },
  { id: '3', name: 'Gamma', amount: 20, status: 'Completed' },
];

describe('dataTableUtils', () => {
  it('filters by global search', () => {
    const result = filterRows(rows, columns, 'beta', {});
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Beta');
  });

  it('filters by column value', () => {
    const result = filterRows(rows, columns, '', { status: 'Completed' });
    expect(result).toHaveLength(2);
  });

  it('sorts ascending and descending', () => {
    const asc = sortRows(rows, columns, { key: 'amount', direction: 'asc' });
    expect(asc.map((row) => row.amount)).toEqual([-5, 10, 20]);

    const desc = sortRows(rows, columns, { key: 'amount', direction: 'desc' });
    expect(desc.map((row) => row.amount)).toEqual([20, 10, -5]);
  });

  it('paginates rows', () => {
    const page = paginateRows(rows, 1, 2);
    expect(page.rows).toHaveLength(2);
    expect(page.totalPages).toBe(2);
    expect(page.startIndex).toBe(1);
    expect(page.endIndex).toBe(2);
  });
});
