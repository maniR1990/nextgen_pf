'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Input } from '@/components/ui/Input';
import {
  DATA_TABLE_DENSITIES,
  type DataTableDensity,
} from '@/constants/dataTable';
import type { DataTableBulkAction } from './types';

interface DataTableToolbarProps<T> {
  globalSearch: string;
  onGlobalSearchChange: (value: string) => void;
  density: DataTableDensity;
  onDensityChange: (density: DataTableDensity) => void;
  selectedCount: number;
  bulkActions?: DataTableBulkAction<T>[];
  selectedRows: T[];
  onClearSelection: () => void;
  onOpenColumnSettings: () => void;
}

export function DataTableToolbar<T>({
  globalSearch,
  onGlobalSearchChange,
  density,
  onDensityChange,
  selectedCount,
  bulkActions = [],
  selectedRows,
  onClearSelection,
  onOpenColumnSettings,
}: DataTableToolbarProps<T>) {
  return (
    <div className="data-table__toolbar">
      <div className="data-table__toolbar-main">
        <div className="data-table__search">
          <Icon icon={Search} size="sm" tone="muted" className="data-table__search-icon" />
          <Input
            aria-label="Search table"
            placeholder="Search..."
            value={globalSearch}
            onChange={(event) => onGlobalSearchChange(event.target.value)}
            className="data-table__search-input"
          />
        </div>
        <div className="data-table__toolbar-actions">
          <label className="data-table__density">
            <span className="data-table__density-label">Density</span>
            <select
              className="data-table__density-select"
              value={density}
              onChange={(event) => onDensityChange(event.target.value as DataTableDensity)}
              aria-label="Table density"
            >
              {DATA_TABLE_DENSITIES.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <Button variant="ghost" size="sm" onClick={onOpenColumnSettings}>
            Columns
          </Button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="data-table__bulk-bar" role="status">
          <span>{selectedCount} selected</span>
          <div className="data-table__bulk-actions">
            {bulkActions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="secondary"
                onClick={() => action.onAction(selectedRows)}
              >
                {action.label}
              </Button>
            ))}
            <Button size="sm" variant="ghost" onClick={onClearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
