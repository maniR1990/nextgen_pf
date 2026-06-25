'use client';

import { Button } from '@/components/ui/Button';
import type { DataTableColumnDef } from './types';

interface DataTableColumnSettingsProps<T extends Record<string, unknown>> {
  open: boolean;
  columns: DataTableColumnDef<T>[];
  columnOrder: string[];
  hiddenColumns: string[];
  onClose: () => void;
  onToggleVisibility: (key: string) => void;
  onMoveColumn: (key: string, direction: 'up' | 'down') => void;
}

export function DataTableColumnSettings<T extends Record<string, unknown>>({
  open,
  columns,
  columnOrder,
  hiddenColumns,
  onClose,
  onToggleVisibility,
  onMoveColumn,
}: DataTableColumnSettingsProps<T>) {
  if (!open) return null;

  const ordered = columnOrder
    .map((key) => columns.find((col) => col.key === key))
    .filter(Boolean) as DataTableColumnDef<T>[];

  return (
    <div className="data-table__column-settings" role="dialog" aria-label="Column settings">
      <div className="data-table__column-settings-header">
        <h3 className="data-table__column-settings-title">Manage columns</h3>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Done
        </Button>
      </div>
      <ul className="data-table__column-settings-list">
        {ordered.map((column, index) => (
          <li key={column.key} className="data-table__column-settings-item">
            <label className="data-table__column-settings-label">
              <input
                type="checkbox"
                checked={!hiddenColumns.includes(column.key)}
                onChange={() => onToggleVisibility(column.key)}
              />
              <span>{column.header}</span>
            </label>
            <div className="data-table__column-settings-order">
              <Button
                size="sm"
                variant="ghost"
                disabled={index === 0}
                onClick={() => onMoveColumn(column.key, 'up')}
                aria-label={`Move ${column.header} up`}
              >
                ↑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={index === ordered.length - 1}
                onClick={() => onMoveColumn(column.key, 'down')}
                aria-label={`Move ${column.header} down`}
              >
                ↓
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
