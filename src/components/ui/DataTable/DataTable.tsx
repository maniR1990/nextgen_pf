'use client';

import { Icon } from '@/components/ui/Icon';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { DataTableColumnSettings } from './DataTableColumnSettings';
import { DataTableEmpty } from './DataTableEmpty';
import { DataTablePagination } from './DataTablePagination';
import { DataTableRowMenu } from './DataTableRowMenu';
import { DataTableToolbar } from './DataTableToolbar';
import { renderDataTableCell } from './cellRenderers';
import type {
  DataTableBulkAction,
  DataTableColumnDef,
  DataTableEmptyState,
  DataTableRowAction,
} from './types';
import { useDataTableState } from './useDataTableState';

export interface DataTableProps<T extends Record<string, unknown> & { id: string }> {
  tableId: string;
  columns: DataTableColumnDef<T>[];
  data: T[];
  loading?: boolean;
  selectable?: boolean;
  rowActions?: DataTableRowAction<T>[];
  bulkActions?: DataTableBulkAction<T>[];
  emptyState?: DataTableEmptyState;
  pageSize?: number;
  persistPreferences?: boolean;
  className?: string;
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: 'asc' | 'desc' | null;
}) {
  if (!active) return <Icon icon={ChevronsUpDown} size="xs" tone="muted" aria-hidden />;
  return (
    <Icon icon={direction === 'asc' ? ArrowUp : ArrowDown} size="xs" tone="brand" aria-hidden />
  );
}

export function dataTableClassName({
  density,
  className = '',
}: {
  density: string;
  className?: string;
}) {
  return ['data-table', `data-table--${density}`, className].filter(Boolean).join(' ');
}

export function DataTable<T extends Record<string, unknown> & { id: string }>({
  tableId,
  columns,
  data,
  loading = false,
  selectable = true,
  rowActions = [],
  bulkActions = [],
  emptyState,
  pageSize,
  persistPreferences = true,
  className = '',
}: DataTableProps<T>) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const resizeState = useRef<{ key: string; startX: number; startWidth: number } | null>(null);

  const state = useDataTableState({
    tableId,
    columns,
    data,
    pageSize,
    persistPreferences,
  });

  const pageRowIds = useMemo(
    () => state.pagination.rows.map((row) => String(row.id)),
    [state.pagination.rows],
  );

  const allPageSelected =
    pageRowIds.length > 0 && pageRowIds.every((id) => state.selectedIds.has(id));
  const somePageSelected = pageRowIds.some((id) => state.selectedIds.has(id)) && !allPageSelected;

  const frozenColumnKey = state.displayColumns.find((col) => col.frozen)?.key;

  const onResizeStart = (key: string, event: { clientX: number }) => {
    const width =
      state.columnWidths[key] ?? state.displayColumns.find((col) => col.key === key)?.width ?? 160;
    resizeState.current = { key, startX: event.clientX, startWidth: width };

    const onMove = (moveEvent: MouseEvent) => {
      if (!resizeState.current) return;
      const delta = moveEvent.clientX - resizeState.current.startX;
      const min =
        state.displayColumns.find((col) => col.key === resizeState.current?.key)?.minWidth ?? 96;
      state.setColumnWidth(
        resizeState.current.key,
        Math.max(min, resizeState.current.startWidth + delta),
      );
    };

    const onUp = () => {
      resizeState.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const hasFilters = state.displayColumns.some((col) => col.filterable);

  return (
    <div
      className={[
        dataTableClassName({ density: state.density, className }),
        selectable && 'data-table--selectable',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <DataTableToolbar
        globalSearch={state.globalSearch}
        onGlobalSearchChange={state.setGlobalSearch}
        density={state.density}
        onDensityChange={state.setDensity}
        selectedCount={state.selectedIds.size}
        bulkActions={bulkActions}
        selectedRows={state.selectedRows}
        onClearSelection={state.clearSelection}
        onOpenColumnSettings={() => setSettingsOpen(true)}
      />

      <DataTableColumnSettings
        open={settingsOpen}
        columns={state.orderedColumns}
        columnOrder={state.columnOrder}
        hiddenColumns={state.hiddenColumns}
        onClose={() => setSettingsOpen(false)}
        onToggleVisibility={state.toggleColumnVisibility}
        onMoveColumn={state.moveColumn}
      />

      <div className="data-table__surface">
        <div className="data-table__scroll table-scroll" role="region" aria-label="Data table">
          <table className="data-table__grid" role="grid">
            <thead className="data-table__head">
              <tr role="row">
                {selectable && (
                  <th
                    className="data-table__head-cell data-table__head-cell--select data-table__cell--frozen"
                    scope="col"
                    aria-label="Select rows"
                  >
                    <input
                      type="checkbox"
                      className="data-table__checkbox"
                      aria-label="Select all rows on page"
                      checked={allPageSelected}
                      ref={(node) => {
                        if (node) node.indeterminate = somePageSelected;
                      }}
                      onChange={(event) =>
                        state.toggleAllPageRows(pageRowIds, event.target.checked)
                      }
                    />
                  </th>
                )}
                {state.displayColumns.map((column) => {
                  const isSorted = state.sort?.key === column.key;
                  const width = state.columnWidths[column.key] ?? column.width;
                  return (
                    <th
                      key={column.key}
                      className={[
                        'data-table__head-cell',
                        column.align === 'right' && 'data-table__head-cell--right',
                        column.key === frozenColumnKey && 'data-table__cell--frozen',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={width ? { width, minWidth: column.minWidth } : undefined}
                      scope="col"
                      aria-sort={
                        isSorted
                          ? state.sort?.direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          className="data-table__sort-button"
                          onClick={() => state.toggleSort(column.key)}
                        >
                          <span>{column.header}</span>
                          <SortIndicator
                            active={isSorted}
                            direction={isSorted ? (state.sort?.direction ?? null) : null}
                          />
                        </button>
                      ) : (
                        column.header
                      )}
                      <span
                        className="data-table__resize-handle"
                        onMouseDown={(event) => onResizeStart(column.key, event)}
                        role="separator"
                        aria-orientation="vertical"
                        aria-label={`Resize ${column.header} column`}
                      />
                    </th>
                  );
                })}
                {rowActions.length > 0 && (
                  <th className="data-table__head-cell data-table__head-cell--actions" scope="col">
                    Actions
                  </th>
                )}
              </tr>
              {hasFilters && (
                <tr className="data-table__filter-row" role="row">
                  {selectable && <th className="data-table__filter-cell" aria-hidden />}
                  {state.displayColumns.map((column) => (
                    <th
                      key={`${column.key}-filter`}
                      className="data-table__filter-cell"
                      aria-hidden={column.filterable ? undefined : true}
                    >
                      {column.filterable ? (
                        <select
                          className="data-table__filter-select"
                          value={state.columnFilters[column.key] ?? ''}
                          onChange={(event) =>
                            state.setColumnFilter(column.key, event.target.value)
                          }
                          aria-label={`Filter ${column.header}`}
                        >
                          <option value="">All</option>
                          {(column.filterOptions ?? []).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : null}
                    </th>
                  ))}
                  {rowActions.length > 0 && <th className="data-table__filter-cell" aria-hidden />}
                </tr>
              )}
            </thead>
            <tbody className="data-table__body">
              {loading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="data-table__row">
                    {selectable && (
                      <td className="data-table__cell">
                        <Skeleton variant="rect" height={16} width={16} />
                      </td>
                    )}
                    {state.displayColumns.map((column) => (
                      <td key={`${column.key}-sk-${index}`} className="data-table__cell">
                        <Skeleton variant="text" />
                      </td>
                    ))}
                    {rowActions.length > 0 && (
                      <td className="data-table__cell">
                        <Skeleton variant="rect" height={24} width={24} />
                      </td>
                    )}
                  </tr>
                ))}

              {!loading &&
                state.pagination.rows.map((row) => (
                  <tr key={String(row.id)} className="data-table__row" role="row">
                    {selectable && (
                      <td className="data-table__cell data-table__cell--select data-table__cell--frozen">
                        <input
                          type="checkbox"
                          className="data-table__checkbox"
                          checked={state.selectedIds.has(String(row.id))}
                          aria-label={`Select row ${String(row.id)}`}
                          onChange={() => state.toggleRow(String(row.id))}
                        />
                      </td>
                    )}
                    {state.displayColumns.map((column) => {
                      const width = state.columnWidths[column.key] ?? column.width;
                      return (
                        <td
                          key={column.key}
                          className={[
                            'data-table__cell',
                            column.align === 'right' && 'data-table__cell--right',
                            column.key === frozenColumnKey && 'data-table__cell--frozen',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          style={width ? { width, minWidth: column.minWidth } : undefined}
                          role="gridcell"
                        >
                          {renderDataTableCell(row, column)}
                        </td>
                      );
                    })}
                    {rowActions.length > 0 && (
                      <td className="data-table__cell data-table__cell--actions" role="gridcell">
                        <DataTableRowMenu row={row} actions={rowActions} />
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && state.pagination.total === 0 && <DataTableEmpty {...emptyState} />}

        <div className="data-table__mobile-cards" aria-label="Data cards">
          {!loading &&
            state.pagination.rows.map((row) => (
              <article key={`card-${String(row.id)}`} className="data-table__card">
                <div className="data-table__card-header">
                  {selectable && (
                    <input
                      type="checkbox"
                      className="data-table__checkbox"
                      checked={state.selectedIds.has(String(row.id))}
                      aria-label={`Select row ${String(row.id)}`}
                      onChange={() => state.toggleRow(String(row.id))}
                    />
                  )}
                  <div className="data-table__card-title">
                    {renderDataTableCell(
                      row,
                      state.displayColumns.find((col) => col.type === 'transaction') ??
                        state.displayColumns[0],
                    )}
                  </div>
                  {rowActions.length > 0 && <DataTableRowMenu row={row} actions={rowActions} />}
                </div>
                <dl className="data-table__card-fields">
                  {state.displayColumns
                    .filter((col) => col.type !== 'transaction')
                    .map((column) => (
                      <div key={column.key} className="data-table__card-field">
                        <dt>{column.header}</dt>
                        <dd>{renderDataTableCell(row, column)}</dd>
                      </div>
                    ))}
                </dl>
              </article>
            ))}
        </div>
      </div>

      <DataTablePagination
        page={state.pagination.page}
        totalPages={state.pagination.totalPages}
        total={state.pagination.total}
        startIndex={state.pagination.startIndex}
        endIndex={state.pagination.endIndex}
        pageSize={state.pageSize}
        onPageChange={state.setPage}
        onPageSizeChange={state.setPageSize}
      />
    </div>
  );
}
