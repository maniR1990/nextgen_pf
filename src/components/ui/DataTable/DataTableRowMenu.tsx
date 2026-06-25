'use client';

import { Icon } from '@/components/ui/Icon';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DataTableRowAction } from './types';

interface DataTableRowMenuProps<T> {
  row: T;
  actions: DataTableRowAction<T>[];
}

export function DataTableRowMenu<T>({ row, actions }: DataTableRowMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div className="data-table__row-menu" ref={rootRef}>
      <button
        type="button"
        className="data-table__row-menu-trigger"
        aria-label="Row actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon icon={MoreHorizontal} size="sm" tone="muted" />
      </button>
      {open && (
        <div className="data-table__row-menu-panel" role="menu">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              className={[
                'data-table__row-menu-item',
                action.destructive && 'data-table__row-menu-item--danger',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                action.onAction(row);
                setOpen(false);
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
